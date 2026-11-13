import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TrainSearchScreen from '@/features/trains/TrainSearchScreen';
import TrainDetailsScreen from '@/features/trains/TrainDetailsScreen';
import BookScreen from '@/features/booking/BookScreen';
import BookingScreen from '@/features/booking/BookingScreen';
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
      <Stack.Screen name="Book" component={BookScreen} options={{ title: 'Book' }} />
      <Stack.Screen name="Booking" component={BookingScreen} options={{ title: 'Booking' }} />
    </Stack.Navigator>
  );
}
