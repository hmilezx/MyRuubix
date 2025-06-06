import React, { createContext, useContext, useState } from 'react';
import { ColorSchemeName, useColorScheme } from 'react-native';

// Define theme interface
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    error: string;
    text: string;
    textSecondary: string;
    disabled: string;
    placeholder: string;
    highlight: string;
    shadow: string;
    border: string;
  };
  spacing: {
    xs: number;
    s: number;
    m: number;
    l: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
    pill: number;
  };
  typography: {
    fontFamily: {
      regular: string;
      medium: string;
      bold: string;
    };
    fontSize: {
      xs: number;
      s: number;
      m: number;
      l: number;
      xl: number;
      xxl: number;
    };
  };
  animation: {
    fast: number;
    medium: number;
    slow: number;
  };
}

// Define light and dark themes
const lightTheme: Theme = {
  colors: {
    primary: '#4285F4',       // Google Blue
    secondary: '#34A853',     // Google Green
    background: '#FFFFFF',
    surface: '#F8F9FA',
    error: '#EA4335',         // Google Red
    text: '#202124',
    textSecondary: '#5F6368',
    disabled: '#DADCE0',
    placeholder: '#9AA0A6',
    highlight: '#E8F0FE',
    shadow: 'rgba(60, 64, 67, 0.3)',
    border: '#DADCE0',
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 16,
    pill: 999,
  },
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 12,
      s: 14,
      m: 16,
      l: 18,
      xl: 20,
      xxl: 24,
    },
  },
  animation: {
    fast: 200,
    medium: 300,
    slow: 500,
  },
};

const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    primary: '#8AB4F8',       // Light blue for dark theme
    secondary: '#81C995',     // Light green for dark theme
    background: '#202124',
    surface: '#303134',
    error: '#F28B82',         // Light red for dark theme
    text: '#E8EAED',
    textSecondary: '#9AA0A6',
    disabled: '#5F6368',
    placeholder: '#9AA0A6',
    highlight: '#3C4043',
    shadow: 'rgba(0, 0, 0, 0.6)',
    border: '#5F6368',
  },
};

// Create theme context
interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorSchemeName;
  toggleColorScheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// Theme provider component
export const ThemeProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const deviceColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(deviceColorScheme);
  
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  
  const toggleColorScheme = () => {
    setColorScheme(prev => prev === 'dark' ? 'light' : 'dark');
  };
  
  return (
    <ThemeContext.Provider value={{ theme, colorScheme, toggleColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};