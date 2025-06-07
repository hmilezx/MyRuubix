// src/core/domain/services/INotificationService.ts
import { User } from '../models/User';

/**
 * Notification types
 */
export type NotificationType = 
  | 'welcome'
  | 'role_changed'
  | 'security_alert'
  | 'solve_milestone'
  | 'system_maintenance'
  | 'feature_announcement';

/**
 * Notification interface
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

/**
 * Notification service interface
 */
export interface INotificationService {
  // Send notifications
  sendNotification(userId: string, notification: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>): Promise<void>;
  sendBulkNotification(userIds: string[], notification: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>): Promise<void>;
  sendRoleNotification(userIds: string[], role: UserRole, notification: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>): Promise<void>;
  
  // Get notifications
  getUserNotifications(userId: string, limit?: number): Promise<Notification[]>;
  getUnreadCount(userId: string): Promise<number>;
  
  // Mark as read
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  
  // Delete notifications
  deleteNotification(notificationId: string): Promise<void>;
  deleteAllNotifications(userId: string): Promise<void>;
  
  // Cleanup
  cleanupExpiredNotifications(): Promise<number>;
}

// src/core/domain/services/ICacheService.ts
/**
 * Cache service interface for performance optimization
 */
export interface ICacheService {
  // Basic cache operations
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  
  // Bulk operations
  getMultiple<T>(keys: string[]): Promise<Record<string, T | null>>;
  setMultiple<T>(items: Record<string, T>, ttl?: number): Promise<void>;
  deleteMultiple(keys: string[]): Promise<void>;
  
  // Cache patterns
  getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>;
  invalidatePattern(pattern: string): Promise<void>;
  
  // Cache management
  getStats(): Promise<CacheStats>;
  healthCheck(): Promise<boolean>;
}

/**
 * Cache statistics interface
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  memoryUsage: number;
  keyCount: number;
  averageResponseTime: number;
}