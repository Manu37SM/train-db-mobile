import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TrainSearchScreen from '@/features/trains/TrainSearchScreen';
import TrainDetailsScreen from '@/features/trains/TrainDetailsScreen';
import type { TrainsStackParamList } from './types';
const Stack = createNativeStackNavigator<TrainsStackParamList>();
export default function TrainsNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TrainSearch"
        component={TrainSearchScreen}
        options={{ title: 'Trains' }}
      />
      <Stack.Screen
        name="TrainDetails"
        component={TrainDetailsScreen}
        options={({ route }) => ({ title: route.params.trainNumber })}
      />
    </Stack.Navigator>
  );
}
