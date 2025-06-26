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
  Dimensions,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import TextField from '../../components/common/TextField';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';

import { EmailSignUpDTO, EmailSignInDTO } from '../../../core/domain/models/User';

/**
 * Enhanced login screen with Google authentication and comprehensive validation
 * Implements clean design with proper RBAC integration
 */
export default function LoginScreen() {
  const { theme } = useTheme();
  const { 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithGoogle,
    resetPassword,
    sendEmailVerification,
    error, 
    clearError, 
    loading,
    initializeSuperAdmin
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
  const [showSuperAdminInit, setShowSuperAdminInit] = useState(false);
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [formSwitchAnim] = useState(new Animated.Value(0));
  
  // Screen dimensions
  const { width, height } = Dimensions.get('window');
  
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
   * Comprehensive form validation
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (isSignUp) {
      // Stronger validation for sign up
      if (!/(?=.*[a-z])/.test(formData.password)) {
        errors.password = 'Password must contain at least one lowercase letter';
      } else if (!/(?=.*[A-Z])/.test(formData.password)) {
        errors.password = 'Password must contain at least one uppercase letter';
      } else if (!/(?=.*\d)/.test(formData.password)) {
        errors.password = 'Password must contain at least one number';
      }
    }
    
    // Sign up specific validation
    if (isSignUp) {
      if (!formData.displayName.trim()) {
        errors.displayName = 'Display name is required';
      } else if (formData.displayName.trim().length < 2) {
        errors.displayName = 'Display name must be at least 2 characters';
      }
      
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
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
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          displayName: formData.displayName.trim(),
          acceptTerms: formData.acceptTerms,
          acceptMarketing: false, // Could be added as checkbox
        };
        
        await signUpWithEmail(signUpData);
        
        // Show success message for sign up
        Alert.alert(
          '🎉 Account Created!',
          'Welcome to Rubix Solver! A verification email has been sent to your inbox. Please verify your email to unlock all features.',
          [
            {
              text: 'Resend Email',
              onPress: handleResendVerification,
              style: 'default'
            },
            { text: 'Continue', style: 'default' }
          ]
        );
      } else {
        const signInData: EmailSignInDTO = {
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          rememberMe: formData.rememberMe,
        };
        
        await signInWithEmail(signInData);
      }
    } catch (error: any) {
      console.error('Email auth error:', error);
      // Error is handled by AuthContext and displayed in UI
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
      
      // Show welcome message for new Google users
      Alert.alert(
        '🎉 Welcome!',
        'Successfully signed in with Google. Start solving cubes now!',
        [{ text: 'Let\'s Go!', style: 'default' }]
      );
    } catch (error: any) {
      console.error('Google auth error:', error);
      
      // Handle specific Google auth errors with user-friendly messages
      if (error.message?.includes('cancelled')) {
        Alert.alert(
          'Sign-in Cancelled',
          'Google sign-in was cancelled. Feel free to try again whenever you\'re ready!',
          [{ text: 'OK' }]
        );
      } else if (error.message?.includes('popup')) {
        Alert.alert(
          'Pop-up Blocked',
          'Please enable pop-ups for this site and try again.',
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
        'Please enter your email address first, then tap "Forgot Password".',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      await resetPassword(formData.email.trim());
      Alert.alert(
        '📧 Reset Email Sent',
        `Password reset instructions have been sent to ${formData.email.trim()}. Please check your inbox and follow the instructions.`,
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
        '📧 Verification Email Sent',
        'Please check your inbox for the verification email. Don\'t forget to check your spam folder!',
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
  
  /**
   * Handle super admin initialization (for development/testing)
   */
  const handleInitializeSuperAdmin = async () => {
    try {
      await initializeSuperAdmin();
      Alert.alert(
        '🛡️ Super Admin Initialized',
        'Super admin account has been created successfully. You can now sign in with the super admin credentials.',
        [{ text: 'OK' }]
      );
      setShowSuperAdminInit(false);
    } catch (error) {
      console.error('Super admin initialization error:', error);
    }
  };
  
  return (
    <>
      <StatusBar
        barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
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
                transform: [{ translateY: slideAnim }],
                maxWidth: Math.min(400, width - 48),
              }
            ]}
          >
            {/* Logo Section */}
            <View style={styles.logoContainer}>
              <Animated.View 
                style={[
                  styles.logoBackground, 
                  { 
                    backgroundColor: theme.colors.primary + '20',
                    transform: [{ 
                      scale: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1]
                      })
                    }]
                  }
                ]}
              >
                <Ionicons name="cube-outline" size={48} color={theme.colors.primary} />
              </Animated.View>
              <Text style={[styles.logoText, { color: theme.colors.textPrimary }]}>
                Rubix Solver
              </Text>
              <Text style={[styles.tagline, { color: theme.colors.textSecondary }]}>
                Master the cube with AI-powered solving
              </Text>
            </View>
            
            {/* Main Form Card */}
            <Card elevation="medium" style={styles.formCard}>
              <Animated.View style={{ 
                opacity: formSwitchAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.3]
                })
              }}>
                <View style={styles.formHeader}>
                  <Text style={[styles.formTitle, { color: theme.colors.textPrimary }]}>
                    {isSignUp ? '🚀 Create Account' : '👋 Welcome Back'}
                  </Text>
                  <Text style={[styles.formSubtitle, { color: theme.colors.textSecondary }]}>
                    {isSignUp 
                      ? 'Join thousands of cubers and start your solving journey' 
                      : 'Sign in to continue your cubing adventure'
                    }
                  </Text>
                </View>
                
                {/* Google Sign In Button */}
                <GoogleSignInButton
                  onPress={handleGoogleAuth}
                  loading={googleLoading}
                  disabled={loading}
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
                      autoComplete="name"
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
                    autoComplete="email"
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
                    autoComplete={isSignUp ? "new-password" : "current-password"}
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
                      autoComplete="new-password"
                      testID="confirm-password-input"
                    />
                  )}
                  
                  {/* Terms and Conditions (Sign Up Only) */}
                  {isSignUp && (
                    <TouchableOpacity 
                      style={styles.checkboxContainer}
                      onPress={() => updateFormData('acceptTerms', !formData.acceptTerms)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.checkbox,
                        { borderColor: formErrors.acceptTerms ? theme.colors.error : theme.colors.border },
                        formData.acceptTerms && { 
                          backgroundColor: theme.colors.primary,
                          borderColor: theme.colors.primary
                        }
                      ]}>
                        {formData.acceptTerms && (
                          <Ionicons name="checkmark" size={16} color={theme.colors.surface} />
                        )}
                      </View>
                      <Text style={[styles.checkboxText, { color: theme.colors.textSecondary }]}>
                        I agree to the{' '}
                        <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>
                          Terms of Service
                        </Text>
                        {' '}and{' '}
                        <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>
                          Privacy Policy
                        </Text>
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* Remember Me (Sign In Only) */}
                  {!isSignUp && (
                    <TouchableOpacity 
                      style={styles.checkboxContainer}
                      onPress={() => updateFormData('rememberMe', !formData.rememberMe)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.checkbox,
                        { borderColor: theme.colors.border },
                        formData.rememberMe && { 
                          backgroundColor: theme.colors.primary,
                          borderColor: theme.colors.primary
                        }
                      ]}>
                        {formData.rememberMe && (
                          <Ionicons name="checkmark" size={16} color={theme.colors.surface} />
                        )}
                      </View>
                      <Text style={[styles.checkboxText, { color: theme.colors.textSecondary }]}>
                        Keep me signed in
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* Error Display */}
                  {error && (
                    <View style={[styles.errorContainer, { backgroundColor: theme.colors.error + '10' }]}>
                      <Ionicons name="alert-circle-outline" size={18} color={theme.colors.error} />
                      <Text style={[styles.errorText, { color: theme.colors.error }]}>
                        {error.message}
                      </Text>
                    </View>
                  )}
                  
                  {/* Submit Button */}
                  <Button
                    title={isSignUp ? "🎯 Create Account" : "🚀 Sign In"}
                    onPress={handleEmailAuth}
                    loading={loading}
                    disabled={loading || googleLoading}
                    style={{ marginTop: 20 }}
                    testID="auth-button"
                  />
                  
                  {/* Forgot Password (Sign In Only) */}
                  {!isSignUp && (
                    <TouchableOpacity 
                      style={styles.forgotPassword} 
                      onPress={handleForgotPassword}
                      disabled={loading}
                    >
                      <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>
                        🔐 Forgot your password?
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
              <TouchableOpacity onPress={toggleAuthMode} disabled={loading}>
                <Text style={[styles.switchLink, { color: theme.colors.primary }]}>
                  {isSignUp ? "Sign In" : "Sign Up"}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Developer Options (only show in development) */}
            {__DEV__ && (
              <View style={styles.devOptions}>
                <TouchableOpacity 
                  onPress={() => setShowSuperAdminInit(!showSuperAdminInit)}
                  style={[styles.devButton, { borderColor: theme.colors.border }]}
                >
                  <Text style={[styles.devButtonText, { color: theme.colors.textSecondary }]}>
                    🛠️ Dev Options
                  </Text>
                </TouchableOpacity>
                
                {showSuperAdminInit && (
                  <TouchableOpacity 
                    onPress={handleInitializeSuperAdmin}
                    style={[styles.devButton, { backgroundColor: theme.colors.error + '20', borderColor: theme.colors.error }]}
                  >
                    <Text style={[styles.devButtonText, { color: theme.colors.error }]}>
                      🛡️ Initialize Super Admin
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
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
    alignSelf: 'center',
    width: '100%',
    minHeight: '90%',
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
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
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
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  forgotPassword: {
    alignSelf: 'center',
    marginTop: 16,
    padding: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  switchText: {
    fontSize: 14,
  },
  switchLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  devOptions: {
    marginTop: 20,
    gap: 10,
  },
  devButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  devButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
});