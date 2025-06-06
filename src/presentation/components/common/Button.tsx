import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { useTheme, fontWeightToStyle } from '../../theme/ThemeProvider';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// Button variant types
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text';

// Button size types
type ButtonSize = 'small' | 'medium' | 'large';

// Button props interface
interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

/**
 * Modern button component with PS5-inspired design
 */
const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  onPressIn,
  onPressOut,
  ...restProps
}) => {
  // Get theme
  const { theme } = useTheme();
  
  // Animation values
  const scale = useSharedValue(1);
  const elevation = useSharedValue(4);
  
  // Handle press in
  const handlePressIn = (e: any) => {
    scale.value = withTiming(0.98, {
      duration: 100,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    elevation.value = withTiming(2, {
      duration: 100,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    
    if (onPressIn) {
      onPressIn(e);
    }
  };
  
  // Handle press out
  const handlePressOut = (e: any) => {
    scale.value = withTiming(1, {
      duration: 200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    elevation.value = withTiming(4, {
      duration: 200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    
    if (onPressOut) {
      onPressOut(e);
    }
  };
  
  // Animated button style
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });
  
  // Get variant styles
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.colors.primary,
          borderWidth: 0,
        };
      case 'secondary':
        return {
          backgroundColor: theme.colors.secondary,
          borderWidth: 0,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: theme.colors.primary,
        };
      case 'text':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
          elevation: 0,
        };
      default:
        return {};
    }
  };
  
  // Get text color based on variant
  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
      case 'secondary':
        return theme.colors.surface;
      case 'outline':
      case 'text':
        return theme.colors.primary;
      default:
        return theme.colors.textPrimary;
    }
  };
  
  // Get size styles
  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.s,
          minHeight: 32,
        };
      case 'medium':
        return {
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.m,
          minHeight: 44,
        };
      case 'large':
        return {
          paddingVertical: theme.spacing.s,
          paddingHorizontal: theme.spacing.l,
          minHeight: 56,
        };
      default:
        return {};
    }
  };
  
  // Get text size based on button size
  const getTextSize = (): TextStyle => {
    switch (size) {
      case 'small':
        return {
          fontSize: theme.typography.fontSize.s,
        };
      case 'medium':
        return {
          fontSize: theme.typography.fontSize.m,
        };
      case 'large':
        return {
          fontSize: theme.typography.fontSize.l,
        };
      default:
        return {};
    }
  };
  
  // Get disabled style
  const getDisabledStyle = (): ViewStyle => {
    if (disabled || loading) {
      return {
        backgroundColor: variant === 'outline' || variant === 'text'
          ? 'transparent'
          : theme.colors.surfaceAlt,
        borderColor: variant === 'outline' ? theme.colors.border : 'transparent',
        opacity: 0.7,
      };
    }
    return {};
  };
  
  // Get disabled text style
  const getDisabledTextStyle = (): TextStyle => {
    if (disabled || loading) {
      return {
        color: theme.colors.textSecondary,
      };
    }
    return {};
  };
  
  // Combined button style
  const buttonStyle = [
    styles.button,
    getSizeStyle(),
    getVariantStyle(),
    getDisabledStyle(),
    fullWidth && styles.fullWidth,
    style,
  ];
  
  // Combined text style
  const combinedTextStyle = [
    styles.text,
    { color: getTextColor() },
    getTextSize(),
    { fontFamily: theme.typography.fontFamily.primary },
    { fontWeight: fontWeightToStyle(theme.typography.fontWeight.medium) },
    getDisabledTextStyle(),
    textStyle,
  ];

  // Render loading indicator if loading
  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'text'
            ? theme.colors.primary
            : theme.colors.surface}
        />
      );
    }

    return (
      <>
        {icon && iconPosition === 'left' && (
          <View style={styles.iconLeft}>
            {icon}
          </View>
        )}
        <Text style={combinedTextStyle} numberOfLines={1}>
          {title}
        </Text>
        {icon && iconPosition === 'right' && (
          <View style={styles.iconRight}>
            {icon}
          </View>
        )}
      </>
    );
  };

  return (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        activeOpacity={0.9}
        disabled={disabled || loading}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={buttonStyle}
        {...restProps}
      >
        {renderContent()}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  text: {
    textAlign: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default Button;