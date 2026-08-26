import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '@/features/auth/LoginScreen';
import RegisterScreen from '@/features/auth/RegisterScreen';
type StandaloneAuthStackParamList = {
  Login: undefined;
  Register: undefined;
};
const Stack = createNativeStackNavigator<StandaloneAuthStackParamList>();
export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
