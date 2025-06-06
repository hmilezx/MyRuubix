import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Secure storage service for storing sensitive data
 * Falls back to AsyncStorage with encryption on platforms without SecureStore
 */
export class SecureStorage {
  private static instance: SecureStorage;
  private encryptionKey: string;
  
  private constructor() {
    // In a real app, generate or retrieve a secure encryption key
    this.encryptionKey = 'your-encryption-key';
  }
  
  public static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }
  
  /**
   * Store a value securely
   */
  public async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Web doesn't support SecureStore, use encrypted AsyncStorage
        await AsyncStorage.setItem(this.getStorageKey(key), this.encrypt(value));
      } else {
        // Use SecureStore on native platforms
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error('Error storing secure data:', error);
      throw new Error('Failed to store data securely');
    }
  }
  
  /**
   * Retrieve a stored value
   */
  public async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        // Web implementation
        const encryptedValue = await AsyncStorage.getItem(this.getStorageKey(key));
        return encryptedValue ? this.decrypt(encryptedValue) : null;
      } else {
        // Native implementation
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error('Error retrieving secure data:', error);
      throw new Error('Failed to retrieve secure data');
    }
  }
  
  /**
   * Delete a stored value
   */
  public async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(this.getStorageKey(key));
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('Error removing secure data:', error);
      throw new Error('Failed to remove secure data');
    }
  }
  
  /**
   * Generate a storage key with prefix
   */
  private getStorageKey(key: string): string {
    return `secure_${key}`;
  }
  
  /**
   * Encrypt a value (simplified example)
   * In a real app, use a proper encryption library
   */
  private encrypt(value: string): string {
    // This is a placeholder for a real encryption implementation
    // Use a library like crypto-js in a real application
    return `encrypted_${value}`;
  }
  
  /**
   * Decrypt a value (simplified example)
   * In a real app, use a proper encryption library
   */
  private decrypt(encryptedValue: string): string {
    // This is a placeholder for a real decryption implementation
    return encryptedValue.replace('encrypted_', '');
  }
}