import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StationSearchScreen from '@/features/stations/StationSearchScreen';
import StationDetailsScreen from '@/features/stations/StationDetailsScreen';
import type { StationsStackParamList } from './types';

const Stack = createNativeStackNavigator<StationsStackParamList>();

export default function StationsNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="StationSearch" component={StationSearchScreen} options={{ title: 'Stations' }} />
      <Stack.Screen
        name="StationDetails"
        component={StationDetailsScreen}
        options={({ route }) => ({ title: route.params.stationCode })}
      />
    </Stack.Navigator>
  );
}
