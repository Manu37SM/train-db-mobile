import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AccountScreen from '@/features/account/AccountScreen';
import FavoritesScreen from '@/features/favorites/FavoritesScreen';
import HistoryScreen from '@/features/history/HistoryScreen';
import SettingsScreen from '@/features/settings/SettingsScreen';
import AdminScreen from '@/features/admin/AdminScreen';
import DevelopersScreen from '@/features/developers/DevelopersScreen';
import LoginScreen from '@/features/auth/LoginScreen';
import RegisterScreen from '@/features/auth/RegisterScreen';
import type { AccountStackParamList } from './types';
const Stack = createNativeStackNavigator<AccountStackParamList>();
export default function AccountNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Account" component={AccountScreen} options={{ title: 'Account' }} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favorites' }} />
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: 'Search History' }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Admin Portal' }} />
      <Stack.Screen
        name="Developers"
        component={DevelopersScreen}
        options={{ title: 'Developers' }}
      />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign in' }} />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Create account' }}
      />
    </Stack.Navigator>
  );
}
