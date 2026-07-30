import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '@/features/auth/LoginScreen';
import RegisterScreen from '@/features/auth/RegisterScreen';

type StandaloneAuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

const Stack = createNativeStackNavigator<StandaloneAuthStackParamList>();

/**
 * Not used by RootNavigator anymore - see RootNavigator.tsx's note. The web
 * app never gates the whole site behind login (only /account redirects to
 * /login when logged out), so the mobile app now nests Login/Register
 * inside AccountNavigator instead of swapping the entire navigation tree on
 * auth state. Kept as a standalone export in case a future flow (e.g. a
 * deep link straight to sign-in) wants an isolated auth stack again.
 */
export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
