import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';

// Import providers
import { ThemeProvider } from './src/presentation/theme/ThemeProvider';
import { AuthProvider } from './src/presentation/context/AuthContext';

// Import navigation
import AppNavigator from './src/presentation/navigation/AppNavigator';

// Import services
import { ConfigProvider } from './src/infrastructure/config/ConfigProvider';
import { FirebaseService } from './src/infrastructure/firebase';
import { FirebaseAuthRepository } from './src/data/repositories/FirebaseAuthRepository';

// Create dependencies
const configProvider = ConfigProvider.getInstance();
const firebaseConfig = configProvider.getFirebaseConfig();
const firebaseService = FirebaseService.getInstance(firebaseConfig);
const authRepository = new FirebaseAuthRepository(firebaseService);

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SafeAreaProvider>
          <AuthProvider authRepository={authRepository}>
            <StatusBar style="auto" />
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </AuthProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}