import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import TextField from '../../components/common/TextField';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

import { EmailSignUpDTO } from '../../../core/domain/models/User';

export default function RegisterScreen() {
  const { theme } = useTheme();
  const { signUpWithEmail, signInWithGoogle, error, clearError, loading } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    acceptTerms: false,
  });
  
  // UI state
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  
  // Initialize animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Clear errors when form changes
  useEffect(() => {
    clearError();
    setFormErrors({});
  }, [clearError]);

  /**
   * Form validation
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Display name validation
    if (!formData.displayName.trim()) {
      errors.displayName = 'Display name is required';
    } else if (formData.displayName.trim().length < 2) {
      errors.displayName = 'Display name must be at least 2 characters';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, and number';
    }
    
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    // Terms acceptance
    if (!formData.acceptTerms) {
      errors.acceptTerms = 'You must accept the terms and conditions';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle registration
   */
  const handleRegister = async () => {
    if (!validateForm()) return;
    
    try {
      clearError();
      
      const signUpData: EmailSignUpDTO = {
        email: formData.email.trim(),
        password: formData.password,
        displayName: formData.displayName.trim(),
        acceptTerms: formData.acceptTerms,
      };
      
      await signUpWithEmail(signUpData);
      
      // Show success message
      Alert.alert(
        'Account Created Successfully! 🎉',
        'A verification email has been sent to your email address. Please verify your email to complete registration.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login' as never),
          }
        ]
      );
    } catch (error: any) {
      console.error('Registration error:', error);
    }
  };

  /**
   * Handle Google registration
   */
  const handleGoogleRegister = async () => {
    try {
      setGoogleLoading(true);
      clearError();
      
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Google registration error:', error);
    } finally {
      setGoogleLoading(false);
    }
  };

  /**
   * Update form data
   */
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={[styles.scrollContainer, { paddingTop: insets.top + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.formContainer,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }] 
            }
          ]}
        >
          {/* Header Section */}
          <View style={styles.headerContainer}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            
            <View style={styles.logoContainer}>
              <View style={[styles.logoBackground, { backgroundColor: theme.colors.primary + '20' }]}>
                <Ionicons name="cube-outline" size={48} color={theme.colors.primary} />
              </View>
              <Text style={[styles.logoText, { color: theme.colors.textPrimary }]}>
                Join Rubix Solver
              </Text>
              <Text style={[styles.tagline, { color: theme.colors.textSecondary }]}>
                Create your account and start solving
              </Text>
            </View>
          </View>
          
          {/* Main Form Card */}
          <Card elevation="medium" style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={[styles.formTitle, { color: theme.colors.textPrimary }]}>
                Create Account
              </Text>
              <Text style={[styles.formSubtitle, { color: theme.colors.textSecondary }]}>
                Fill in your details to get started
              </Text>
            </View>
            
            {/* Google Sign Up Button */}
            <Button
              title={googleLoading ? "Creating Account..." : "Continue with Google"}
              variant="outline"
              onPress={handleGoogleRegister}
              loading={googleLoading}
              disabled={loading || googleLoading}
              icon={
                <Ionicons 
                  name="logo-google" 
                  size={20} 
                  color={theme.colors.primary} 
                />
              }
              style={{ marginBottom: 20 }}
            />
            
            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
              <Text style={[styles.dividerText, { color: theme.colors.textSecondary }]}>
                or create with email
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            </View>
            
            {/* Form Fields */}
            <View style={styles.formFields}>
              {/* Display Name */}
              <TextField
                label="Display Name"
                value={formData.displayName}
                onChangeText={(value) => updateFormData('displayName', value)}
                placeholder="Enter your display name"
                leftIcon={<Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} />}
                error={formErrors.displayName}
                autoCapitalize="words"
                required
              />
              
              {/* Email */}
              <TextField
                label="Email Address"
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                placeholder="Enter your email"
                keyboardType="email-address"
                leftIcon={<Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} />}
                error={formErrors.email}
                autoCapitalize="none"
                required
              />
              
              {/* Password */}
              <TextField
                label="Password"
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                placeholder="Create a strong password"
                secureTextEntry={!passwordVisible}
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} />}
                rightIcon={
                  <Ionicons
                    name={passwordVisible ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                }
                onRightIconPress={() => setPasswordVisible(!passwordVisible)}
                error={formErrors.password}
                helper="Must contain uppercase, lowercase, and number"
                required
              />
              
              {/* Confirm Password */}
              <TextField
                label="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
                placeholder="Confirm your password"
                secureTextEntry={!confirmPasswordVisible}
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} />}
                rightIcon={
                  <Ionicons
                    name={confirmPasswordVisible ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                }
                onRightIconPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                error={formErrors.confirmPassword}
                required
              />
              
              {/* Terms and Conditions */}
              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => updateFormData('acceptTerms', !formData.acceptTerms)}
              >
                <View style={[
                  styles.checkbox,
                  { borderColor: formErrors.acceptTerms ? theme.colors.error : theme.colors.border },
                  formData.acceptTerms && { backgroundColor: theme.colors.primary }
                ]}>
                  {formData.acceptTerms && (
                    <Ionicons name="checkmark" size={16} color={theme.colors.surface} />
                  )}
                </View>
                <Text style={[styles.checkboxText, { color: theme.colors.textSecondary }]}>
                  I agree to the <Text style={{ color: theme.colors.primary }}>Terms of Service</Text> and{' '}
                  <Text style={{ color: theme.colors.primary }}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>
              
              {formErrors.acceptTerms && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {formErrors.acceptTerms}
                </Text>
              )}
              
              {/* Error Display */}
              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle-outline" size={18} color={theme.colors.error} />
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>
                    {error.message}
                  </Text>
                </View>
              )}
              
              {/* Register Button */}
              <Button
                title="Create Account"
                onPress={handleRegister}
                loading={loading}
                disabled={loading || googleLoading}
                style={{ marginTop: 20 }}
              />
            </View>
          </Card>
          
          {/* Sign In Link */}
          <View style={styles.switchContainer}>
            <Text style={[styles.switchText, { color: theme.colors.textSecondary }]}>
              Already have an account?
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
              <Text style={[styles.switchLink, { color: theme.colors.primary }]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  headerContainer: {
    marginBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  formCard: {
    padding: 24,
    marginBottom: 24,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
  },
  formFields: {
    gap: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  switchText: {
    fontSize: 14,
  },
  switchLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});