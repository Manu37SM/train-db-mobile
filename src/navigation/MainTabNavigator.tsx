import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HomeNavigator from './HomeNavigator';
import TrainsNavigator from './TrainsNavigator';
import StationsNavigator from './StationsNavigator';
import JourneysNavigator from './JourneysNavigator';
import ExploreNavigator from './ExploreNavigator';
import AccountNavigator from './AccountNavigator';
import type { MainTabParamList } from './types';
const Tab = createBottomTabNavigator<MainTabParamList>();
const ICONS: Record<keyof MainTabParamList, string> = {
  HomeTab: 'home-outline',
  TrainsTab: 'train',
  StationsTab: 'domain',
  JourneysTab: 'map-marker-path',
  ExploreTab: 'compass-outline',
  AccountTab: 'account-circle-outline',
};
export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <Icon name={ICONS[route.name]} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeNavigator} options={{ title: 'Home' }} />
      <Tab.Screen name="TrainsTab" component={TrainsNavigator} options={{ title: 'Trains' }} />
      <Tab.Screen
        name="StationsTab"
        component={StationsNavigator}
        options={{ title: 'Stations' }}
      />
      <Tab.Screen
        name="JourneysTab"
        component={JourneysNavigator}
        options={{ title: 'Journeys' }}
      />
      <Tab.Screen name="ExploreTab" component={ExploreNavigator} options={{ title: 'Explore' }} />
      <Tab.Screen name="AccountTab" component={AccountNavigator} options={{ title: 'Account' }} />
    </Tab.Navigator>
  );
}
