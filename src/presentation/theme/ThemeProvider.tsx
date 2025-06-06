import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme, TextStyle } from 'react-native';

// Type for valid React Native fontWeight values
export type FontWeight = TextStyle['fontWeight'];

/**
 * Theme interface representing the design system tokens
 */
export interface Theme {
  // Color system
  colors: {
    primary: string;
    secondary: string;
    tertiary: string;
    error: string;
    background: string;
    surface: string;
    surfaceAlt: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
    gradient1: string;
    gradient2: string;
  };

  // Typography
  typography: {
    fontFamily: {
      primary: string;
      fallback: string;
    };
    fontSize: {
      xs: number;
      s: number;
      m: number;
      l: number;
      xl: number;
      xxl: number;
      xxxl: number;
    };
    fontWeight: {
      light: string;
      regular: string;
      medium: string;
      bold: string;
      black: string;
    };
    letterSpacing: {
      xs: number;
      s: number;
      m: number;
      l: number;
      xl: number;
    };
  };

  // Spacing system
  spacing: {
    xxxs: number;
    xxs: number;
    xs: number;
    s: number;
    m: number;
    l: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };

  // Border radius
  borderRadius: {
    none: number;
    xs: number;
    s: number;
    m: number;
    l: number;
    pill: number;
  };

  // Elevation (shadows)
  elevation: {
    level0: string;
    level1: string;
    level2: string;
    level3: string;
    level4: string;
  };

  // Animation timing
  animation: {
    duration: {
      fast: number;
      medium: number;
      slow: number;
    };
    easing: {
      standard: string;
      decelerate: string;
      accelerate: string;
      sharp: string;
    };
  };

  // Theme mode
  mode: 'light' | 'dark';
}

// Light theme definition
const lightTheme: Theme = {
  colors: {
    primary: '#0070D1',
    secondary: '#7A39E0',
    tertiary: '#00AEBA',
    error: '#FF2E2E',
    background: '#F8F9FB',
    surface: '#FFFFFF',
    surfaceAlt: '#EAEEF3',
    textPrimary: '#0B0E14',
    textSecondary: '#4C5967',
    border: '#DADFE7',
    gradient1: 'linear-gradient(135deg, #0070D1, #7A39E0)',
    gradient2: 'linear-gradient(135deg, #7A39E0, #00AEBA)',
  },
  typography: {
    fontFamily: {
      primary: 'System',  // Changed to System as PS5 font isn't available by default
      fallback: 'System',
    },
    fontSize: {
      xs: 12,
      s: 14,
      m: 16,
      l: 20,
      xl: 24,
      xxl: 32,
      xxxl: 40,
    },
    fontWeight: {
      light: '300',
      regular: '400',
      medium: '500',
      bold: '700',
      black: '900',
    },
    letterSpacing: {
      xs: 0.5,
      s: 0.25,
      m: 0,
      l: -0.5,
      xl: -1,
    },
  },
  spacing: {
    xxxs: 2,
    xxs: 4,
    xs: 8,
    s: 16,
    m: 24,
    l: 32,
    xl: 48,
    xxl: 64,
    xxxl: 80,
  },
  borderRadius: {
    none: 0,
    xs: 2,
    s: 4,
    m: 8,
    l: 16,
    pill: 9999,
  },
  elevation: {
    level0: 'none',
    level1: '0 2px 8px rgba(0, 0, 0, 0.08)',
    level2: '0 4px 16px rgba(0, 0, 0, 0.12)',
    level3: '0 8px 24px rgba(0, 0, 0, 0.16)',
    level4: '0 12px 32px rgba(0, 0, 0, 0.20)',
  },
  animation: {
    duration: {
      fast: 150,
      medium: 300,
      slow: 500,
    },
    easing: {
      standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
    },
  },
  mode: 'light',
};

// Dark theme definition
const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    primary: '#2ACAFF',
    secondary: '#A474FF',
    tertiary: '#76F4FF',
    error: '#FF5C5C',
    background: '#0B0E14',
    surface: '#171B23',
    surfaceAlt: '#212631',
    textPrimary: '#FFFFFF',
    textSecondary: '#A0A7B7',
    border: '#2A3141',
    gradient1: 'linear-gradient(135deg, #0070D1, #7A39E0)',
    gradient2: 'linear-gradient(135deg, #7A39E0, #00AEBA)',
  },
  elevation: {
    level0: 'none',
    level1: '0 2px 8px rgba(0, 0, 0, 0.2)',
    level2: '0 4px 16px rgba(0, 0, 0, 0.24)',
    level3: '0 8px 24px rgba(0, 0, 0, 0.32)',
    level4: '0 12px 32px rgba(0, 0, 0, 0.40)',
  },
  mode: 'dark',
};

// Helper function to convert string weights to valid React Native fontWeight
export const fontWeightToStyle = (weight: string): FontWeight => {
  switch (weight) {
    case '300': return '300';
    case '400': return 'normal';
    case '500': return '500';
    case '700': return 'bold';
    case '900': return '900';
    default: return 'normal';
  };
};

// Context type with theme state and setter
interface ThemeContextType {
  theme: Theme;
  setTheme: (mode: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
}

// Create theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider props
interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: 'light' | 'dark' | 'system';
}

/**
 * Theme provider component that provides the design system theme to the application
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialTheme = 'system',
}) => {
  // Get system color scheme
  const colorScheme = useColorScheme();
  
  // Theme state
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(initialTheme);
  const [theme, setThemeState] = useState<Theme>(
    themeMode === 'system'
      ? colorScheme === 'dark'
        ? darkTheme
        : lightTheme
      : themeMode === 'dark'
      ? darkTheme
      : lightTheme
  );

  // Update theme when system color scheme changes
  useEffect(() => {
    if (themeMode === 'system') {
      setThemeState(colorScheme === 'dark' ? darkTheme : lightTheme);
    }
  }, [colorScheme, themeMode]);

  // Set theme mode
  const setTheme = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    
    if (mode === 'system') {
      setThemeState(colorScheme === 'dark' ? darkTheme : lightTheme);
    } else {
      setThemeState(mode === 'dark' ? darkTheme : lightTheme);
    }
  };

  // Toggle between light and dark theme
  const toggleTheme = () => {
    const newMode = theme.mode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    setThemeState(newMode === 'light' ? lightTheme : darkTheme);
  };

  // Context value
  const contextValue: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to use the theme in components
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};