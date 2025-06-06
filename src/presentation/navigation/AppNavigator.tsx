import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';

// Import screens
import LoginScreen from '../screens/LoginScreen';
// Import your other screens here, like HomeScreen and SolveScreen
// For now, let's create a placeholder HomeScreen
const HomeScreen = () => <></>;
const SolveScreen = () => <></>;

// Define navigation parameter types
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Solve: { cubeState?: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // Authenticated user routes
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Solve" component={SolveScreen} />
        </>
      ) : (
        // Unauthenticated user routes
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}