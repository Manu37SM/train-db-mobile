import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SmartSearchScreen from '@/features/smartSearch/SmartSearchScreen';
import RankingsScreen from '@/features/stats/RankingsScreen';
import FunFactsScreen from '@/features/stats/FunFactsScreen';
import AchievementsScreen from '@/features/stats/AchievementsScreen';
import StatsScreen from '@/features/stats/StatsScreen';
import NetworkScreen from '@/features/network/NetworkScreen';
import type { ExploreStackParamList } from './types';
const Stack = createNativeStackNavigator<ExploreStackParamList>();
export default function ExploreNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SmartSearch"
        component={SmartSearchScreen}
        options={{ title: 'Smart Search' }}
      />
      <Stack.Screen name="Rankings" component={RankingsScreen} options={{ title: 'Rankings' }} />
      <Stack.Screen name="FunFacts" component={FunFactsScreen} options={{ title: 'Fun Facts' }} />
      <Stack.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{ title: 'Achievements' }}
      />
      <Stack.Screen name="Network" component={NetworkScreen} options={{ title: 'Network' }} />
      <Stack.Screen name="Stats" component={StatsScreen} options={{ title: 'Statistics' }} />
    </Stack.Navigator>
  );
}
