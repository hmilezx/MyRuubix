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
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { Ionicons } from '@expo/vector-icons';

/**
 * Enhanced login screen with animations and modern UI
 */
export default function LoginScreen() {
  const { theme } = useTheme();
  const { login, register, error, clearError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  
  // Run entrance animation on mount
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
  
  // Validate form inputs
  const validateForm = (): string | null => {
    if (!email.trim()) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Please enter a valid email';
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (isSignUp && !name.trim()) return 'Name is required';
    return null;
  };
  
  // Handle authentication
  const handleAuth = async () => {
    const validationError = validateForm();
    if (validationError) {
      // Show validation error
      return;
    }
    
    clearError();
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
    } catch (error) {
      console.log('Authentication error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle between login and signup
  const toggleAuthMode = () => {
    clearError();
    setIsSignUp(!isSignUp);
    
    // Add animation for mode switch
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
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
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/cube-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.logoText, { color: theme.colors.primary }]}>
              Ruubix 3D
            </Text>
            <Text style={[styles.tagline, { color: theme.colors.textSecondary }]}>
              Solve your Rubik's cube with AI
            </Text>
          </View>
          
          <View style={styles.formFields}>
            {isSignUp && (
              <TextField
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                leftIcon={<Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} />}
                autoCapitalize="words"
                testID="name-input"
              />
            )}
            
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              leftIcon={<Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} />}
              testID="email-input"
            />
            
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
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
              testID="password-input"
            />
            
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={18} color={theme.colors.error} />
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {error.message}
                </Text>
              </View>
            )}
            
            <Button
              title={isSignUp ? "Create Account" : "Sign In"}
              onPress={handleAuth}
              loading={isLoading}
              disabled={isLoading}
              style={{ marginTop: theme.spacing.m }}
              testID="auth-button"
            />
            
            {!isSignUp && (
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={{ color: theme.colors.primary }}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.footer}>
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
              <Text style={[styles.dividerText, { color: theme.colors.textSecondary }]}>
                {isSignUp ? "Already have an account?" : "Don't have an account?"}
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            </View>
            
            <Button
              title={isSignUp ? "Sign In Instead" : "Create Account"}
              onPress={toggleAuthMode}
              variant="outline"
              style={{ marginTop: theme.spacing.m }}
              testID="toggle-auth-mode-button"
            />
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
  },
  formFields: {
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 14,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 12,
    padding: 4,
  },
  footer: {
    marginTop: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
  },
});