import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { User } from '../../core/domain/models/User';

/**
 * Navigation Factory responsible for creating appropriate navigation structure
 * Based on Factory pattern and Strategy pattern
 */
export class NavigationFactory {
  createNavigator(user: User | null, screens: Record<string, React.ComponentType<any>>) {
    // Create appropriate stack based on authentication state
    const navigationStrategy = user
       ? new AuthenticatedNavigationStrategy()
       : new UnauthenticatedNavigationStrategy();
       
    return navigationStrategy.createNavigator(screens);
  }
}

/**
 * Interface for navigation strategies following Strategy pattern
 */
interface NavigationStrategy {
  createNavigator(screens: Record<string, React.ComponentType<any>>): React.ReactNode;
}

/**
 * Authenticated user navigation strategy
 */
class AuthenticatedNavigationStrategy implements NavigationStrategy {
  createNavigator(screens: Record<string, React.ComponentType<any>>) {
    const Stack = createStackNavigator();
    
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={screens.Home} />
        <Stack.Screen name="Solve" component={screens.Solve} />
        <Stack.Screen name="Profile" component={screens.Profile} />
        <Stack.Screen name="Settings" component={screens.Settings} />
      </Stack.Navigator>
    );
  }
}

/**
 * Unauthenticated user navigation strategy
 */
class UnauthenticatedNavigationStrategy implements NavigationStrategy {
  createNavigator(screens: Record<string, React.ComponentType<any>>) {
    const Stack = createStackNavigator();
    
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={screens.Login} />
        <Stack.Screen name="Register" component={screens.Register} />
        <Stack.Screen name="ForgotPassword" component={screens.ForgotPassword} />
      </Stack.Navigator>
    );
  }
}