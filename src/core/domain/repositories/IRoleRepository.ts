import { 
  UserRole, 
  Permission,
  RoleAssignmentDTO,
  RoleChangeRequest 
} from '../models/User';

/**
 * Role repository interface for role and permission management
 * Handles role assignments with proper authorization and audit logging
 */
export interface IRoleRepository {
  // Role management
  assignRole(assignment: RoleAssignmentDTO): Promise<void>;
  removeRole(userId: string, removedBy: string): Promise<void>;
  getUserRole(userId: string): Promise<UserRole>;
  getUserPermissions(userId: string): Promise<Permission[]>;
  
  // Role change requests
  createRoleChangeRequest(request: RoleChangeRequest): Promise<string>;
  approveRoleChangeRequest(requestId: string, approvedBy: string): Promise<void>;
  rejectRoleChangeRequest(requestId: string, rejectedBy: string, reason?: string): Promise<void>;
  getPendingRoleRequests(): Promise<RoleChangeRequest[]>;
  
  // Role validation
  validateRoleAssignment(assignerRole: UserRole, targetRole: UserRole): boolean;
  canUserAssignRole(assignerId: string, targetRole: UserRole): Promise<boolean>;
  
  // Audit and statistics
  getRoleAssignmentHistory(userId?: string, limit?: number): Promise<RoleAuditLog[]>;
  getRoleStatistics(): Promise<RoleStatistics>;
}

/**
 * Role audit log interface
 */
export interface RoleAuditLog {
  id: string;
  action: 'role_assigned' | 'role_removed' | 'role_requested' | 'request_approved' | 'request_rejected';
  performedBy: string;
  targetUserId: string;
  timestamp: Date;
  details: {
    previousRole?: UserRole;
    newRole?: UserRole;
    reason?: string;
    requestId?: string;
  };
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    source?: string;
  };
}

/**
 * Role statistics interface
 */
export interface RoleStatistics {
  totalByRole: Record<UserRole, number>;
  recentChanges: number;
  pendingRequests: number;
  averageApprovalTime?: number;
  mostActiveAdmins?: Array<{
    userId: string;
    displayName: string;
    actionsCount: number;
  }>;
}