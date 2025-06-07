import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import TextField from '../components/common/TextField';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

import { EmailSignUpDTO, EmailSignInDTO } from '../../core/domain/models/User';

// Google Sign-In button component
const GoogleSignInButton: React.FC<{
  onPress: () => void;
  loading?: boolean;
  style?: any;
}> = ({ onPress, loading = false, style }) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity
      style={[
        styles.googleButton,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        style
      ]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
    >
      <View style={styles.googleButtonContent}>
        <Image
          source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
          style={styles.googleIcon}
        />
        <Text style={[
          styles.googleButtonText,
          { color: theme.colors.textPrimary }
        ]}>
          {loading ? 'Signing in...' : 'Continue with Google'}
        </Text>
      </View>
      {loading && (
        <View style={styles.googleButtonLoader}>
          <Ionicons name="refresh" size={16} color={theme.colors.textSecondary} />
        </View>
      )}
    </TouchableOpacity>
  );
};

/**
 * Enhanced login screen with Google authentication and comprehensive validation
 */
export default function EnhancedLoginScreen() {
  const { theme } = useTheme();
  const { 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithGoogle,
    resetPassword,
    sendEmailVerification,
    error, 
    clearError, 
    loading
  } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Form state
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    acceptTerms: false,
    rememberMe: false,
  });
  
  // UI state
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [formSwitchAnim] = useState(new Animated.Value(0));
  
  // Screen dimensions
  const { width } = Dimensions.get('window');
  
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
  
  // Clear errors when switching forms
  useEffect(() => {
    clearError();
    setFormErrors({});
  }, [isSignUp, clearError]);
  
  /**
   * Form validation
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
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
    } else if (isSignUp && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, and number';
    }
    
    // Sign up specific validation
    if (isSignUp) {
      if (!formData.displayName.trim()) {
        errors.displayName = 'Display name is required';
      }
      
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
      
      if (!formData.acceptTerms) {
        errors.acceptTerms = 'You must accept the terms and conditions';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  /**
   * Handle email authentication
   */
  const handleEmailAuth = async () => {
    if (!validateForm()) return;
    
    try {
      clearError();
      
      if (isSignUp) {
        const signUpData: EmailSignUpDTO = {
          email: formData.email.trim(),
          password: formData.password,
          displayName: formData.displayName.trim(),
          acceptTerms: formData.acceptTerms,
        };
        
        await signUpWithEmail(signUpData);
        
        // Show success message for sign up
        Alert.alert(
          'Account Created! 🎉',
          'A verification email has been sent. Please check your inbox and verify your email address.',
          [
            {
              text: 'Resend Email',
              onPress: handleResendVerification,
              style: 'default'
            },
            { text: 'OK', style: 'default' }
          ]
        );
      } else {
        const signInData: EmailSignInDTO = {
          email: formData.email.trim(),
          password: formData.password,
          rememberMe: formData.rememberMe,
        };
        
        await signInWithEmail(signInData);
      }
    } catch (error: any) {
      console.error('Email auth error:', error);
      // Error is handled by AuthContext
    }
  };
  
  /**
   * Handle Google authentication
   */
  const handleGoogleAuth = async () => {
    try {
      setGoogleLoading(true);
      clearError();
      
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Google auth error:', error);
      
      // Handle specific Google auth errors
      if (error.message.includes('popup_closed_by_user')) {
        Alert.alert(
          'Sign-in Cancelled',
          'Google sign-in was cancelled. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setGoogleLoading(false);
    }
  };
  
  /**
   * Handle forgot password
   */
  const handleForgotPassword = async () => {
    if (!formData.email.trim()) {
      Alert.alert(
        'Email Required',
        'Please enter your email address first.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      await resetPassword(formData.email.trim());
      Alert.alert(
        'Password Reset Sent',
        'Check your email for password reset instructions.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Password reset error:', error);
    }
  };
  
  /**
   * Handle resend verification email
   */
  const handleResendVerification = async () => {
    try {
      await sendEmailVerification();
      Alert.alert(
        'Verification Email Sent',
        'Please check your inbox for the verification email.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Resend verification error:', error);
    }
  };
  
  /**
   * Toggle between sign in and sign up
   */
  const toggleAuthMode = () => {
    clearError();
    setFormErrors({});
    
    // Reset form data when switching
    setFormData({
      email: formData.email, // Keep email
      password: '',
      confirmPassword: '',
      displayName: '',
      acceptTerms: false,
      rememberMe: formData.rememberMe, // Keep remember me
    });
    
    // Animate form switch
    Animated.sequence([
      Animated.timing(formSwitchAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(formSwitchAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    setIsSignUp(!isSignUp);
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
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <View style={[styles.logoBackground, { backgroundColor: theme.colors.primary + '20' }]}>
              <Ionicons name="cube-outline" size={48} color={theme.colors.primary} />
            </View>
            <Text style={[styles.logoText, { color: theme.colors.textPrimary }]}>
              Rubix Solver
            </Text>
            <Text style={[styles.tagline, { color: theme.colors.textSecondary }]}>
              Master the cube with AI-powered solving
            </Text>
          </View>
          
          {/* Main Form Card */}
          <Card elevation="medium" style={styles.formCard}>
            <Animated.View style={{ opacity: formSwitchAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0.3]
            })}}>
              <View style={styles.formHeader}>
                <Text style={[styles.formTitle, { color: theme.colors.textPrimary }]}>
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </Text>
                <Text style={[styles.formSubtitle, { color: theme.colors.textSecondary }]}>
                  {isSignUp 
                    ? 'Sign up to start solving cubes' 
                    : 'Sign in to continue your journey'
                  }
                </Text>
              </View>
              
              {/* Google Sign In Button */}
              <GoogleSignInButton
                onPress={handleGoogleAuth}
                loading={googleLoading}
                style={{ marginBottom: 20 }}
              />
              
              {/* Divider */}
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
                <Text style={[styles.dividerText, { color: theme.colors.textSecondary }]}>
                  or continue with email
                </Text>
                <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
              </View>
              
              {/* Form Fields */}
              <View style={styles.formFields}>
                {/* Display Name (Sign Up Only) */}
                {isSignUp && (
                  <TextField
                    label="Display Name"
                    value={formData.displayName}
                    onChangeText={(value) => updateFormData('displayName', value)}
                    placeholder="Enter your display name"
                    leftIcon={<Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} />}
                    error={formErrors.displayName}
                    autoCapitalize="words"
                    testID="display-name-input"
                  />
                )}
                
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
                  testID="email-input"
                />
                
                {/* Password */}
                <TextField
                  label="Password"
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  placeholder={isSignUp ? "Create a strong password" : "Enter your password"}
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
                  testID="password-input"
                />
                
                {/* Confirm Password (Sign Up Only) */}
                {isSignUp && (
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
                    testID="confirm-password-input"
                  />
                )}
                
                {/* Terms and Conditions (Sign Up Only) */}
                {isSignUp && (
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
                )}
                
                {/* Remember Me (Sign In Only) */}
                {!isSignUp && (
                  <TouchableOpacity 
                    style={styles.checkboxContainer}
                    onPress={() => updateFormData('rememberMe', !formData.rememberMe)}
                  >
                    <View style={[
                      styles.checkbox,
                      { borderColor: theme.colors.border },
                      formData.rememberMe && { backgroundColor: theme.colors.primary }
                    ]}>
                      {formData.rememberMe && (
                        <Ionicons name="checkmark" size={16} color={theme.colors.surface} />
                      )}
                    </View>
                    <Text style={[styles.checkboxText, { color: theme.colors.textSecondary }]}>
                      Remember me
                    </Text>
                  </TouchableOpacity>
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
                
                {/* Submit Button */}
                <Button
                  title={isSignUp ? "Create Account" : "Sign In"}
                  onPress={handleEmailAuth}
                  loading={loading}
                  disabled={loading || googleLoading}
                  style={{ marginTop: 20 }}
                  testID="auth-button"
                />
                
                {/* Forgot Password (Sign In Only) */}
                {!isSignUp && (
                  <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
                    <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>
                      Forgot your password?
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </Card>
          
          {/* Switch Auth Mode */}
          <View style={styles.switchContainer}>
            <Text style={[styles.switchText, { color: theme.colors.textSecondary }]}>
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
            </Text>
            <TouchableOpacity onPress={toggleAuthMode}>
              <Text style={[styles.switchLink, { color: theme.colors.primary }]}>
                {isSignUp ? "Sign In" : "Sign Up"}
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
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
  googleButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  googleButtonLoader: {
    position: 'absolute',
    right: 16,
    top: 12,
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
  forgotPassword: {
    alignSelf: 'center',
    marginTop: 16,
    padding: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
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