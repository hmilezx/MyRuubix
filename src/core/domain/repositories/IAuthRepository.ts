import { User } from '../models/User';
/**
 * Authentication repository interface following Interface Segregation Principle
 */
export interface IAuthRepository {
  getCurrentUser(): Promise<User | null>;
  login(email: string, password: string): Promise<User>;
  register(email: string, password: string, displayName?: string): Promise<User>;
  logout(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  updateProfile(user: Partial<User>): Promise<void>;
}