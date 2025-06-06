import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';

// Using the same theme approach as in TextField
const defaultTheme = {
  colors: {
    primary: '#4285F4',
    secondary: '#34A853',
  },
  borderRadius: {
    medium: 8,
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
  },
  typography: {
    fontSize: {
      m: 16,
    },
  },
};

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  testID,
}) => {
  const theme = defaultTheme; // Replace with useTheme() when available
  
  // Generate dynamic styles based on props and theme
  const getButtonStyles = (): StyleProp<ViewStyle> => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.medium,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };
    
    // Size variations
    const sizeStyles: Record<string, ViewStyle> = {
      small: {
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.m,
      },
      medium: {
        paddingVertical: theme.spacing.s,
        paddingHorizontal: theme.spacing.l,
      },
      large: {
        paddingVertical: theme.spacing.m,
        paddingHorizontal: theme.spacing.xl,
      },
    };
    
    // Variant styles
    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: theme.colors.primary,
      },
      secondary: {
        backgroundColor: theme.colors.secondary,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.primary,
      },
      text: {
        backgroundColor: 'transparent',
      },
    };
    
    // Disabled state
    const disabledStyle: ViewStyle = {
      opacity: 0.6,
    };
    
    return [
      baseStyle,
      sizeStyles[size],
      variantStyles[variant],
      disabled && disabledStyle,
      style,
    ];
  };
  
  // Generate text styles
  const getTextStyles = (): StyleProp<TextStyle> => {
    const baseStyle: TextStyle = {
      fontSize: theme.typography.fontSize.m,
      fontWeight: '600',
    };
    
    const variantTextStyles: Record<string, TextStyle> = {
      primary: {
        color: '#FFFFFF',
      },
      secondary: {
        color: '#FFFFFF',
      },
      outline: {
        color: theme.colors.primary,
      },
      text: {
        color: theme.colors.primary,
      },
    };
    
    return [baseStyle, variantTextStyles[variant], textStyle];
  };
  
  // Render loading spinner if loading
  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'text' 
            ? theme.colors.primary 
            : '#FFFFFF'}
        />
      );
    }
    
    return (
      <>
        {leftIcon && <Text style={{ marginRight: theme.spacing.xs }}>{leftIcon}</Text>}
        <Text style={getTextStyles()}>{title}</Text>
        {rightIcon && <Text style={{ marginLeft: theme.spacing.xs }}>{rightIcon}</Text>}
      </>
    );
  };
  
  return (
    <TouchableOpacity
      style={getButtonStyles()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      testID={testID}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};