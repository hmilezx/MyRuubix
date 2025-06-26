import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface GoogleSignInButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'outline' | 'icon-only';
  size?: 'small' | 'medium' | 'large';
}

/**
 * Google Sign-In button component with proper branding and animations
 * Follows Google's brand guidelines for sign-in buttons
 */
export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onPress,
  loading = false,
  disabled = false,
  style,
  variant = 'default',
  size = 'medium',
}) => {
  const { theme } = useTheme();
  
  // Animation values
  const scale = useSharedValue(1);
  const elevation = useSharedValue(2);
  
  // Handle press in
  const handlePressIn = () => {
    scale.value = withTiming(0.98, {
      duration: 100,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    elevation.value = withTiming(1, {
      duration: 100,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  };
  
  // Handle press out
  const handlePressOut = () => {
    scale.value = withTiming(1, {
      duration: 200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    elevation.value = withTiming(2, {
      duration: 200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  };
  
  // Animated button style
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });
  
  // Get size styles
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 12,
          minHeight: 36,
        };
      case 'medium':
        return {
          paddingVertical: 12,
          paddingHorizontal: 16,
          minHeight: 44,
        };
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 20,
          minHeight: 52,
        };
      default:
        return {};
    }
  };
  
  // Get text size
  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'medium':
        return 16;
      case 'large':
        return 18;
      default:
        return 16;
    }
  };
  
  // Get icon size
  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 18;
      case 'medium':
        return 20;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };
  
  // Get variant styles
  const getVariantStyle = () => {
    switch (variant) {
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.colors.border,
        };
      case 'icon-only':
        return {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          paddingHorizontal: getSizeStyle().paddingVertical,
          width: getSizeStyle().minHeight,
          height: getSizeStyle().minHeight,
        };
      default:
        return {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
        };
    }
  };
  
  // Get disabled styles
  const getDisabledStyle = () => {
    if (disabled || loading) {
      return {
        opacity: 0.6,
      };
    }
    return {};
  };
  
  // Render Google icon
  const renderGoogleIcon = () => {
    const iconSize = getIconSize();
    
    // For better branding, you should use the actual Google logo SVG
    // For now, we'll use a placeholder that represents the Google logo
    return (
      <View style={[styles.googleIconContainer, { width: iconSize, height: iconSize }]}>
        {/* This would ideally be the official Google "G" logo SVG */}
        <View style={[styles.googleIcon, { width: iconSize, height: iconSize }]}>
          <Text style={[styles.googleIconText, { fontSize: iconSize * 0.6 }]}>G</Text>
        </View>
      </View>
    );
  };
  
  // Render button content
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContent}>
          <ActivityIndicator
            size="small"
            color={theme.colors.textPrimary}
            style={{ marginRight: variant === 'icon-only' ? 0 : 8 }}
          />
          {variant !== 'icon-only' && (
            <Text style={[styles.buttonText, { 
              color: theme.colors.textPrimary,
              fontSize: getTextSize()
            }]}>
              Signing in...
            </Text>
          )}
        </View>
      );
    }

    if (variant === 'icon-only') {
      return renderGoogleIcon();
    }

    return (
      <View style={styles.buttonContent}>
        {renderGoogleIcon()}
        <Text style={[styles.buttonText, { 
          color: theme.colors.textPrimary,
          fontSize: getTextSize(),
          marginLeft: 12
        }]}>
          Continue with Google
        </Text>
      </View>
    );
  };

  return (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        style={[
          styles.button,
          getSizeStyle(),
          getVariantStyle(),
          getDisabledStyle(),
          {
            shadowColor: theme.mode === 'dark' ? '#000' : '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: theme.mode === 'dark' ? 0.3 : 0.1,
            shadowRadius: 4,
            elevation: disabled || loading ? 0 : 2,
          },
          style,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
        testID="google-signin-button"
      >
        {renderContent()}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Alternative compact version for spaces where full button is too large
export const GoogleSignInIcon: React.FC<{
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
}> = ({ onPress, loading = false, disabled = false, size = 40, style }) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity
      style={[
        styles.iconButton,
        {
          width: size,
          height: size,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: disabled || loading ? 0.6 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.textPrimary} />
      ) : (
        <View style={[styles.googleIcon, { width: size * 0.5, height: size * 0.5 }]}>
          <Text style={[styles.googleIconText, { fontSize: size * 0.3 }]}>G</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Helper component for custom Google branding
export const GoogleBrandingText: React.FC<{
  variant?: 'signin' | 'signup' | 'continue';
  style?: StyleProp<any>;
}> = ({ variant = 'continue', style }) => {
  const { theme } = useTheme();
  
  const getText = () => {
    switch (variant) {
      case 'signin':
        return 'Sign in with Google';
      case 'signup':
        return 'Sign up with Google';
      case 'continue':
        return 'Continue with Google';
      default:
        return 'Continue with Google';
    }
  };
  
  return (
    <Text style={[
      styles.brandingText,
      { color: theme.colors.textPrimary },
      style
    ]}>
      {getText()}
    </Text>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '500',
    textAlign: 'center',
  },
  googleIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    backgroundColor: '#4285F4',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'Arial', // Google brand font fallback
  },
  iconButton: {
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  brandingText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default GoogleSignInButton;