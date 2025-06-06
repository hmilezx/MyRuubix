import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  TouchableOpacity,
} from 'react-native';

// Since ThemeProvider might not be fully implemented yet, we'll create a simple version
// You can replace this with your actual theme implementation later
const defaultTheme = {
  colors: {
    primary: '#4285F4',
    error: '#EA4335',
    border: '#DADCE0',
    text: '#202124',
    textSecondary: '#5F6368',
    placeholder: '#9AA0A6',
    surface: '#F8F9FA',
    disabled: '#DADCE0',
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
  },
  borderRadius: {
    medium: 8,
  },
  typography: {
    fontSize: {
      xs: 12,
      s: 14,
      m: 16,
    },
  },
};

interface TextFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
  disabled?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  testID?: string;
}

export const TextField: React.FC<TextFieldProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  secureTextEntry = false,
  disabled = false,
  autoCapitalize = 'none',
  keyboardType = 'default',
  style,
  inputStyle,
  leftIcon,
  rightIcon,
  onRightIconPress,
  testID,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const theme = defaultTheme; // Replace with useTheme() when available
  
  // Determine border color based on state
  const getBorderColor = () => {
    if (error) return theme.colors.error;
    if (isFocused) return theme.colors.primary;
    return theme.colors.border;
  };
  
  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: error
                ? theme.colors.error
                : isFocused
                ? theme.colors.primary
                : theme.colors.textSecondary,
              marginBottom: theme.spacing.xs,
              fontSize: theme.typography.fontSize.s,
            },
          ]}
        >
          {label}
        </Text>
      )}
      
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            borderRadius: theme.borderRadius.medium,
            backgroundColor: disabled
              ? theme.colors.disabled
              : theme.colors.surface,
            paddingHorizontal: theme.spacing.m,
            paddingVertical: theme.spacing.s,
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          style={[
            styles.input,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.m,
              flex: 1,
            },
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholder}
          secureTextEntry={secureTextEntry}
          editable={!disabled}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          testID={testID}
        />
        
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={styles.rightIcon}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text
          style={[
            styles.errorText,
            {
              color: theme.colors.error,
              fontSize: theme.typography.fontSize.xs,
              marginTop: theme.spacing.xs,
            },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  input: {
    padding: 0,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  errorText: {
    fontWeight: '400',
  },
});