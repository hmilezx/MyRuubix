import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TextInputProps,
  ViewStyle,
  StyleProp,
  TextStyle,
  Animated,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useTheme, fontWeightToStyle } from '../../theme/ThemeProvider';

// TextField props interface
interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
  errorStyle?: StyleProp<TextStyle>;
  helperStyle?: StyleProp<TextStyle>;
  required?: boolean;
  onRightIconPress?: () => void; // Added this prop for right icon press functionality
}

/**
 * Modern text field component with PS5-inspired design
 */
const TextField: React.FC<TextFieldProps> = ({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  helperStyle,
  required,
  value,
  onFocus,
  onBlur,
  onRightIconPress, // Handle the right icon press
  ...restProps
}) => {
  // Get theme
  const { theme } = useTheme();
  
  // Component state
  const [isFocused, setIsFocused] = useState(false);
  
  // Animation values for label
  const [labelAnim] = useState(new Animated.Value(value ? 1 : 0));
  
  // Handle focus
  const handleFocus = (e: any) => {
    setIsFocused(true);
    Animated.timing(labelAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    
    if (onFocus) {
      onFocus(e);
    }
  };
  
  // Handle blur
  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (!value) {
      Animated.timing(labelAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
    
    if (onBlur) {
      onBlur(e);
    }
  };
  
  // Calculate animated label styles
  const labelStyles = {
    top: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [16, -8],
    }),
    fontSize: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.typography.fontSize.m, theme.typography.fontSize.xs],
    }),
    color: isFocused
      ? theme.colors.primary
      : error
      ? theme.colors.error
      : theme.colors.textSecondary,
  };
  
  // Border color based on state
  const getBorderColor = () => {
    if (error) return theme.colors.error;
    if (isFocused) return theme.colors.primary;
    return theme.colors.border;
  };
  
  // Background color based on state
  const getBackgroundColor = () => {
    if (isFocused) {
      return theme.mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.05)' 
        : 'rgba(0, 0, 0, 0.02)';
    }
    return theme.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.03)' 
      : 'rgba(0, 0, 0, 0.01)';
  };
  
  // Right icon with press handler
  const renderRightIcon = () => {
    if (!rightIcon) return null;
    
    return onRightIconPress ? (
      <TouchableOpacity style={styles.rightIcon} onPress={onRightIconPress}>
        {rightIcon}
      </TouchableOpacity>
    ) : (
      <View style={styles.rightIcon}>
        {rightIcon}
      </View>
    );
  };
  
  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      <Animated.Text
        style={[
          styles.label,
          {
            top: labelStyles.top,
            fontSize: labelStyles.fontSize,
            color: labelStyles.color,
            backgroundColor: theme.colors.background,
            fontFamily: theme.typography.fontFamily.primary,
            fontWeight: fontWeightToStyle(theme.typography.fontWeight.medium),
          },
          labelStyle,
        ]}
      >
        {label}{required && <Text style={{ color: theme.colors.error }}> *</Text>}
      </Animated.Text>
      
      {/* Input container */}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            backgroundColor: getBackgroundColor(),
          },
        ]}
      >
        {/* Left icon */}
        {leftIcon && (
          <View style={styles.leftIcon}>
            {leftIcon}
          </View>
        )}
        
        {/* Text input */}
        <TextInput
          style={[
            styles.input,
            {
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.fontFamily.primary,
              fontSize: theme.typography.fontSize.m,
              paddingLeft: leftIcon ? 0 : 12,
              paddingRight: rightIcon ? 0 : 12,
            },
            inputStyle,
          ]}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={theme.colors.textSecondary}
          selectionColor={theme.colors.primary}
          {...restProps}
        />
        
        {/* Right icon */}
        {renderRightIcon()}
      </View>
      
      {/* Error message */}
      {error && (
        <Text
          style={[
            styles.errorText,
            {
              color: theme.colors.error,
              fontFamily: theme.typography.fontFamily.primary,
              fontSize: theme.typography.fontSize.xs,
            },
            errorStyle,
          ]}
        >
          {error}
        </Text>
      )}
      
      {/* Helper text */}
      {!error && helper && (
        <Text
          style={[
            styles.helperText,
            {
              color: theme.colors.textSecondary,
              fontFamily: theme.typography.fontFamily.primary,
              fontSize: theme.typography.fontSize.xs,
            },
            helperStyle,
          ]}
        >
          {helper}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    position: 'relative',
    width: '100%',
  },
  label: {
    position: 'absolute',
    left: 12,
    paddingHorizontal: 4,
    zIndex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    minHeight: 56,
  },
  input: {
    flex: 1,
  },
  leftIcon: {
    paddingLeft: 12,
    paddingRight: 8,
  },
  rightIcon: {
    paddingRight: 12,
    paddingLeft: 8,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 12,
  },
  helperText: {
    marginTop: 4,
    marginLeft: 12,
  },
});

export default TextField;