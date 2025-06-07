import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';

import { 
  UserRole, 
  Permission,
  RoleAssignmentDTO,
  RoleChangeRequest,
  UserRoleUtils 
} from '../../core/domain/models/User';
import { IRoleRepository, RoleAuditLog, RoleStatistics } from '../../core/domain/repositories/IRoleRepository';
import { IFirebaseService } from '../../core/domain/services/IFirebaseService';

/**
 * Firebase implementation of role repository
 * Handles role assignments, permissions, and role change requests with audit logging
 */
export class FirebaseRoleRepository implements IRoleRepository {
  private readonly usersCollection = 'users';
  private readonly roleRequestsCollection = 'role_requests';
  private readonly auditLogsCollection = 'audit_logs';
  
  constructor(private firebaseService: IFirebaseService) {}

  /**
   * Assign role to user with proper validation and audit logging
   */
  async assignRole(assignment: RoleAssignmentDTO): Promise<void> {
    try {
      const firestore = this.firebaseService.getFirestore();
      
      await runTransaction(firestore, async (transaction) => {
        // Get user document
        const userRef = doc(firestore, this.usersCollection, assignment.userId);
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists()) {
          throw new Error('User not found');
        }
        
        const userData = userDoc.data();
        const currentRole = userData.role as UserRole;
        
        // Validate role assignment
        const assignerRole = await this.getUserRole(assignment.assignedBy);
        if (!this.validateRoleAssignment(assignerRole, assignment.newRole)) {
          throw new Error('Insufficient privileges to assign this role');
        }
        
        // Update user role and permissions
        const newPermissions = UserRoleUtils.getPermissionsForRole(assignment.newRole);
        
        transaction.update(userRef, {
          role: assignment.newRole,
          permissions: newPermissions,
          lastRoleModifiedAt: serverTimestamp(),
          lastRoleModifiedBy: assignment.assignedBy,
          updatedAt: serverTimestamp()
        });
        
        // Create audit log
        const auditLogRef = doc(collection(firestore, this.auditLogsCollection));
        transaction.set(auditLogRef, {
          action: 'role_assigned',
          performedBy: assignment.assignedBy,
          targetUserId: assignment.userId,
          details: {
            previousRole: currentRole,
            newRole: assignment.newRole,
            reason: assignment.reason
          },
          timestamp: serverTimestamp(),
          metadata: {
            userAgent: 'mobile-app',
            source: 'admin-panel'
          }
        });
      });
      
      console.log(`Role assigned: ${assignment.userId} -> ${assignment.newRole} by ${assignment.assignedBy}`);
    } catch (error) {
      console.error('Error assigning role:', error);
      throw new Error(`Failed to assign role: ${error.message}`);
    }
  }

  /**
   * Remove role from user (revert to default USER role)
   */
  async removeRole(userId: string, removedBy: string): Promise<void> {
    try {
      const firestore = this.firebaseService.getFirestore();
      
      await runTransaction(firestore, async (transaction) => {
        // Get user document
        const userRef = doc(firestore, this.usersCollection, userId);
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists()) {
          throw new Error('User not found');
        }
        
        const userData = userDoc.data();
        const currentRole = userData.role as UserRole;
        
        // Validate removal permissions
        const removerRole = await this.getUserRole(removedBy);
        if (!this.validateRoleAssignment(removerRole, UserRole.USER)) {
          throw new Error('Insufficient privileges to remove this role');
        }
        
        // Prevent removing super admin role
        if (currentRole === UserRole.SUPER_ADMIN) {
          throw new Error('Cannot remove super admin role');
        }
        
        // Update to default user role
        const newPermissions = UserRoleUtils.getPermissionsForRole(UserRole.USER);
        
        transaction.update(userRef, {
          role: UserRole.USER,
          permissions: newPermissions,
          lastRoleModifiedAt: serverTimestamp(),
          lastRoleModifiedBy: removedBy,
          updatedAt: serverTimestamp()
        });
        
        // Create audit log
        const auditLogRef = doc(collection(firestore, this.auditLogsCollection));
        transaction.set(auditLogRef, {
          action: 'role_removed',
          performedBy: removedBy,
          targetUserId: userId,
          details: {
            previousRole: currentRole,
            newRole: UserRole.USER
          },
          timestamp: serverTimestamp()
        });
      });
      
      console.log(`Role removed: ${userId} -> USER by ${removedBy}`);
    } catch (error) {
      console.error('Error removing role:', error);
      throw new Error(`Failed to remove role: ${error.message}`);
    }
  }

  /**
   * Get user's current role
   */
  async getUserRole(userId: string): Promise<UserRole> {
    try {
      const firestore = this.firebaseService.getFirestore();
      const userDoc = await getDoc(doc(firestore, this.usersCollection, userId));
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      return userDoc.data().role as UserRole || UserRole.USER;
    } catch (error) {
      console.error('Error getting user role:', error);
      return UserRole.USER; // Default to user role on error
    }
  }

  /**
   * Get user's current permissions
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    try {
      const role = await this.getUserRole(userId);
      return UserRoleUtils.getPermissionsForRole(role);
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return UserRoleUtils.getPermissionsForRole(UserRole.USER);
    }
  }

  /**
   * Create role change request
   */
  async createRoleChangeRequest(request: RoleChangeRequest): Promise<string> {
    try {
      const firestore = this.firebaseService.getFirestore();
      const requestRef = doc(collection(firestore, this.roleRequestsCollection));
      
      const requestDoc = {
        ...request,
        id: requestRef.id,
        timestamp: serverTimestamp(),
        status: 'pending',
        approved: false
      };
      
      await setDoc(requestRef, requestDoc);
      
      console.log(`Role change request created: ${requestRef.id}`);
      return requestRef.id;
    } catch (error) {
      console.error('Error creating role change request:', error);
      throw new Error(`Failed to create role change request: ${error.message}`);
    }
  }

  /**
   * Approve role change request
   */
  async approveRoleChangeRequest(requestId: string, approvedBy: string): Promise<void> {
    try {
      const firestore = this.firebaseService.getFirestore();
      
      await runTransaction(firestore, async (transaction) => {
        // Get request document
        const requestRef = doc(firestore, this.roleRequestsCollection, requestId);
        const requestDoc = await transaction.get(requestRef);
        
        if (!requestDoc.exists()) {
          throw new Error('Role change request not found');
        }
        
        const requestData = requestDoc.data() as RoleChangeRequest;
        
        if (requestData.approved) {
          throw new Error('Request already processed');
        }
        
        // Validate approver permissions
        const approverRole = await this.getUserRole(approvedBy);
        if (!this.validateRoleAssignment(approverRole, requestData.requestedRole)) {
          throw new Error('Insufficient privileges to approve this role change');
        }
        
        // Apply role change
        await this.assignRole({
          userId: requestData.userId,
          newRole: requestData.requestedRole,
          assignedBy: approvedBy,
          reason: `Approved request: ${requestData.reason}`
        });
        
        // Update request status
        transaction.update(requestRef, {
          approved: true,
          approvedBy,
          approvedAt: serverTimestamp(),
          status: 'approved'
        });
      });
      
      console.log(`Role change request approved: ${requestId} by ${approvedBy}`);
    } catch (error) {
      console.error('Error approving role change request:', error);
      throw new Error(`Failed to approve role change request: ${error.message}`);
    }
  }

  /**
   * Reject role change request
   */
  async rejectRoleChangeRequest(requestId: string, rejectedBy: string, reason?: string): Promise<void> {
    try {
      const firestore = this.firebaseService.getFirestore();
      const requestRef = doc(firestore, this.roleRequestsCollection, requestId);
      
      // Check if request exists
      const requestDoc = await getDoc(requestRef);
      if (!requestDoc.exists()) {
        throw new Error('Role change request not found');
      }
      
      const requestData = requestDoc.data() as RoleChangeRequest;
      if (requestData.approved) {
        throw new Error('Request already processed');
      }
      
      // Update request status
      await updateDoc(requestRef, {
        approved: false,
        rejectedBy,
        rejectedAt: serverTimestamp(),
        rejectionReason: reason,
        status: 'rejected'
      });
      
      console.log(`Role change request rejected: ${requestId} by ${rejectedBy}`);
    } catch (error) {
      console.error('Error rejecting role change request:', error);
      throw new Error(`Failed to reject role change request: ${error.message}`);
    }
  }

  /**
   * Get pending role change requests
   */
  async getPendingRoleRequests(): Promise<RoleChangeRequest[]> {
    try {
      const firestore = this.firebaseService.getFirestore();
      const q = query(
        collection(firestore, this.roleRequestsCollection),
        where('status', '==', 'pending'),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as RoleChangeRequest[];
    } catch (error) {
      console.error('Error getting pending role requests:', error);
      throw new Error(`Failed to get pending role requests: ${error.message}`);
    }
  }

  /**
   * Validate role assignment permissions
   */
  validateRoleAssignment(assignerRole: UserRole, targetRole: UserRole): boolean {
    // Super admin can assign any role
    if (assignerRole === UserRole.SUPER_ADMIN) {
      return true;
    }
    
    // Admin can assign user role only
    if (assignerRole === UserRole.ADMIN && targetRole === UserRole.USER) {
      return true;
    }
    
    // Users cannot assign roles
    return false;
  }

  /**
   * Check if user can assign a specific role
   */
  async canUserAssignRole(assignerId: string, targetRole: UserRole): Promise<boolean> {
    try {
      const assignerRole = await this.getUserRole(assignerId);
      return this.validateRoleAssignment(assignerRole, targetRole);
    } catch (error) {
      console.error('Error checking role assignment permission:', error);
      return false;
    }
  }

  /**
   * Get role assignment history for audit purposes
   */
  async getRoleAssignmentHistory(userId?: string, limit: number = 50): Promise<RoleAuditLog[]> {
    try {
      const firestore = this.firebaseService.getFirestore();
      let q = query(
        collection(firestore, this.auditLogsCollection),
        where('action', 'in', ['role_assigned', 'role_removed']),
        orderBy('timestamp', 'desc')
      );
      
      if (userId) {
        q = query(q, where('targetUserId', '==', userId));
      }
      
      q = query(q, limit(limit));
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as RoleAuditLog[];
    } catch (error) {
      console.error('Error getting role assignment history:', error);
      throw new Error(`Failed to get role assignment history: ${error.message}`);
    }
  }

  /**
   * Get role statistics
   */
  async getRoleStatistics(): Promise<RoleStatistics> {
    try {
      const firestore = this.firebaseService.getFirestore();
      
      // Get all users to count by role
      const usersQuery = query(collection(firestore, this.usersCollection));
      const usersSnapshot = await getDocs(usersQuery);
      
      const totalByRole: Record<UserRole, number> = {
        [UserRole.SUPER_ADMIN]: 0,
        [UserRole.ADMIN]: 0,
        [UserRole.USER]: 0
      };
      
      usersSnapshot.docs.forEach(doc => {
        const role = doc.data().role as UserRole;
        if (role in totalByRole) {
          totalByRole[role]++;
        }
      });
      
      // Get recent changes (last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentChangesQuery = query(
        collection(firestore, this.auditLogsCollection),
        where('action', 'in', ['role_assigned', 'role_removed']),
        where('timestamp', '>=', Timestamp.fromDate(weekAgo))
      );
      const recentChangesSnapshot = await getDocs(recentChangesQuery);
      
      // Get pending requests
      const pendingRequestsQuery = query(
        collection(firestore, this.roleRequestsCollection),
        where('status', '==', 'pending')
      );
      const pendingRequestsSnapshot = await getDocs(pendingRequestsQuery);
      
      return {
        totalByRole,
        recentChanges: recentChangesSnapshot.size,
        pendingRequests: pendingRequestsSnapshot.size
      };
    } catch (error) {
      console.error('Error getting role statistics:', error);
      throw new Error(`Failed to get role statistics: ${error.message}`);
    }
  }
}