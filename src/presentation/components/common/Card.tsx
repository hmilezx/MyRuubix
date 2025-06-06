import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// Card elevation types
type CardElevation = 'none' | 'low' | 'medium' | 'high';

// Card props interface
interface CardProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  elevation?: CardElevation;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  footer?: React.ReactNode;
  headerRight?: React.ReactNode;
}

/**
 * Modern card component with PS5-inspired design
 */
const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  elevation = 'medium',
  onPress,
  style,
  titleStyle,
  subtitleStyle,
  contentStyle,
  footer,
  headerRight,
}) => {
  // Get theme
  const { theme } = useTheme();
  
  // Animation values
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(
    elevation === 'none' ? 0 : elevation === 'low' ? 0.1 : elevation === 'medium' ? 0.15 : 0.2
  );
  
  // Get elevation style
  const getElevationStyle = (): ViewStyle => {
    switch (elevation) {
      case 'none':
        return {
          elevation: 0,
          shadowOpacity: 0,
        };
      case 'low':
        return {
          elevation: 1,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        };
      case 'medium':
        return {
          elevation: 2,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        };
      case 'high':
        return {
          elevation: 3,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
        };
      default:
        return {};
    }
  };
  
  // Handle press in
  const handlePressIn = () => {
    if (onPress) {
      scale.value = withTiming(0.98, {
        duration: 150,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      shadowOpacity.value = withTiming(
        elevation === 'none' ? 0 : elevation === 'low' ? 0.05 : elevation === 'medium' ? 0.1 : 0.15,
        { duration: 150 }
      );
    }
  };
  
  // Handle press out
  const handlePressOut = () => {
    if (onPress) {
      scale.value = withTiming(1, {
        duration: 200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      shadowOpacity.value = withTiming(
        elevation === 'none' ? 0 : elevation === 'low' ? 0.1 : elevation === 'medium' ? 0.15 : 0.2,
        { duration: 200 }
      );
    }
  };
  
  // Animated card style
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      shadowOpacity: shadowOpacity.value,
    };
  });
  
  // Combined card style
  const cardStyle = [
    styles.card,
    {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.m,
      shadowColor: theme.mode === 'dark' ? '#000' : '#000',
      borderWidth: theme.mode === 'dark' ? 1 : 0,
      borderColor: theme.mode === 'dark' ? theme.colors.border : 'transparent',
    },
    getElevationStyle(),
    style,
  ];
  
  // Check if card has header
  const hasHeader = !!title || !!subtitle || !!headerRight;
  
  // Convert string weight to valid fontWeight
  const getFontWeight = (weight: string): TextStyle['fontWeight'] => {
    // Map string weights to valid React Native fontWeight values
    switch (weight) {
      case '300': return '300';
      case '400': return 'normal';
      case '500': return '500';
      case '700': return 'bold';
      case '900': return '900';
      default: return 'normal';
    }
  };
  
  // Card content
  const CardContent = () => (
    <View style={cardStyle}>
      {hasHeader && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {title && (
              <Text
                style={[
                  styles.title,
                  {
                    color: theme.colors.textPrimary,
                    fontSize: theme.typography.fontSize.l,
                    fontFamily: theme.typography.fontFamily.primary,
                    fontWeight: getFontWeight(theme.typography.fontWeight.bold),
                    letterSpacing: theme.typography.letterSpacing.l,
                  },
                  titleStyle,
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
            )}
            {subtitle && (
              <Text
                style={[
                  styles.subtitle,
                  {
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.fontSize.s,
                    fontFamily: theme.typography.fontFamily.primary,
                    marginTop: theme.spacing.xxs,
                  },
                  subtitleStyle,
                ]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </View>
          {headerRight && (
            <View style={styles.headerRight}>
              {headerRight}
            </View>
          )}
        </View>
      )}
      
      {children && (
        <View style={[styles.content, contentStyle]}>
          {children}
        </View>
      )}
      
      {footer && (
        <View style={[
          styles.footer,
          { borderTopColor: theme.colors.border }
        ]}>
          {footer}
        </View>
      )}
    </View>
  );
  
  // Render card with or without touch
  return onPress ? (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <CardContent />
      </TouchableOpacity>
    </Animated.View>
  ) : (
    <CardContent />
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    marginLeft: 16,
  },
  title: {
    flexShrink: 1,
  },
  subtitle: {
    flexShrink: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
});

export default Card;