import { 
  User, 
  UserRole, 
  CreateUserDTO,
  UpdateUserDTO,
  CubeStats 
} from '../models/User';

/**
 * Pagination parameters for queries
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * User filtering options
 */
export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  emailVerified?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  lastLoginAfter?: Date;
  lastLoginBefore?: Date;
  authProvider?: string;
  hasPermission?: string;
}

/**
 * User repository interface for data access operations
 * Follows Repository pattern with clean separation from data layer
 */
export interface IUserRepository {
  // Basic CRUD operations
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getAllUsers(pagination?: PaginationParams): Promise<PaginatedResult<User>>;
  createUser(userData: CreateUserDTO): Promise<User>;
  updateUser(userId: string, userData: UpdateUserDTO): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  
  // User status management
  activateUser(userId: string): Promise<void>;
  deactivateUser(userId: string): Promise<void>;
  
  // Search and filtering
  searchUsers(query: string, filters?: UserFilters): Promise<User[]>;
  getUsersByRole(role: UserRole): Promise<User[]>;
  
  // User statistics and activity
  updateLastLogin(userId: string): Promise<void>;
  updateUserStats(userId: string, stats: Partial<CubeStats>): Promise<void>;
  getUserStatsSummary(): Promise<UserStatsSummary>;
}

/**
 * User statistics summary interface
 */
export interface UserStatsSummary {
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<UserRole, number>;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  averageSessionDuration?: number;
  totalSessions?: number;
}