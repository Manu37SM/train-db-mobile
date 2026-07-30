import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { IconButton } from 'react-native-paper';
import JourneySearchScreen from '@/features/journeys/JourneySearchScreen';
import SavedJourneysScreen from '@/features/savedJourneys/SavedJourneysScreen';
import type { JourneysStackParamList } from './types';

const Stack = createNativeStackNavigator<JourneysStackParamList>();

export default function JourneysNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="JourneySearch"
        component={JourneySearchScreen}
        options={({ navigation }) => ({
          title: 'Journeys',
          // Mirrors web Navbar's persistent "Saved" link - otherwise
          // SavedJourneysScreen would have no way to be reached at all.
          headerRight: () => <IconButton icon="bookmark-multiple-outline" onPress={() => navigation.navigate('SavedJourneys')} />,
        })}
      />
      <Stack.Screen name="SavedJourneys" component={SavedJourneysScreen} options={{ title: 'Saved Journeys' }} />
    </Stack.Navigator>
  );
}
