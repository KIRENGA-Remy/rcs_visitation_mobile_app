import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen }  from '@screens/auth/WelcomeScreen';
import { LoginScreen }    from '@screens/auth/LoginScreen';
import { RegisterScreen } from '@screens/auth/RegisterScreen';
import { CompleteSetupScreen } from '@screens/auth/CompleteSetupScreen';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Welcome"  component={WelcomeScreen} />
    <Stack.Screen name="Login"    component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ActivateAccount" component={CompleteSetupScreen} />
  </Stack.Navigator>
);
