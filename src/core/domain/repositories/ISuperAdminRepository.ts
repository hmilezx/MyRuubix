// src/core/domain/repositories/ISuperAdminRepository.ts
import { User, UserRole } from '../models/User';

/**
 * System statistics interface
 */
export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<UserRole, number>;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  averageSessionDuration: number;
  totalSessions: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  lastBackup?: Date;
  storageUsed: number;
  apiCallsToday: number;
}

/**
 * User report interface
 */
export interface UserReport {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  roleDistribution: Record<UserRole, number>;
  recentActivity: UserActivity[];
  topUsers: TopUser[];
  growthMetrics: GrowthMetrics;
}

/**
 * User activity interface
 */
export interface UserActivity {
  userId: string;
  userEmail: string;
  displayName?: string;
  action: string;
  timestamp: Date;
  details?: Record<string, any>;
  ipAddress?: string;
}

/**
 * Top user interface
 */
export interface TopUser {
  userId: string;
  displayName: string;
  email: string;
  totalSolves: number;
  averageTime: number;
  bestTime: number;
  rank: number;
  streak: number;
}

/**
 * Growth metrics interface
 */
export interface GrowthMetrics {
  dailySignups: Array<{ date: Date; count: number }>;
  monthlyActive: Array<{ month: string; count: number }>;
  retentionRate: number;
  churnRate: number;
}

/**
 * Audit log interface
 */
export interface AuditLog {
  id: string;
  userId: string;
  performedBy: string;
  action: string;
  resource: string;
  timestamp: Date;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  outcome: 'success' | 'failure' | 'warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Super admin repository interface
 */
export interface ISuperAdminRepository {
  // Super admin operations
  initializeSuperAdmin(): Promise<User>;
  isSuperAdminInitialized(): Promise<boolean>;
  
  // System management
  getSystemStats(): Promise<SystemStats>;
  generateUserReport(dateRange?: { start: Date; end: Date }): Promise<UserReport>;
  auditUserActions(userId?: string, startDate?: Date, endDate?: Date): Promise<AuditLog[]>;
  
  // Emergency operations
  forcePasswordReset(userId: string, reason: string): Promise<void>;
  emergencyRoleRevocation(userId: string, reason: string): Promise<void>;
  systemMaintenance(enable: boolean, message?: string): Promise<void>;
  
  // Data management
  exportAllUserData(): Promise<string>; // Returns download URL
  importUserData(data: any[]): Promise<ImportResult>;
  purgeInactiveUsers(inactiveDays: number): Promise<PurgeResult>;
  
  // Security operations
  detectSuspiciousActivity(): Promise<SuspiciousActivity[]>;
  blockUserAccess(userId: string, reason: string): Promise<void>;
  unblockUserAccess(userId: string): Promise<void>;
}

/**
 * Import result interface
 */
export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  warnings: Array<{ row: number; warning: string }>;
}

/**
 * Purge result interface
 */
export interface PurgeResult {
  usersFound: number;
  usersPurged: number;
  errors: string[];
  backupCreated: boolean;
  backupUrl?: string;
}

/**
 * Suspicious activity interface
 */
export interface SuspiciousActivity {
  id: string;
  userId: string;
  userEmail: string;
  activityType: 'multiple_failed_logins' | 'unusual_location' | 'rapid_api_calls' | 'role_escalation_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  details: Record<string, any>;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

