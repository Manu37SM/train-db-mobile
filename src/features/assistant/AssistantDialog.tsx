import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, View, StyleSheet } from 'react-native';
import { Chip, IconButton, Modal, Text, TextInput } from 'react-native-paper';
import { useFavoritesStore } from '@/features/favorites/store';
import { useHistoryStore } from '@/features/history/store';
import { navigationRef } from '@/navigation/navigationRef';
import {
  AssistantAction,
  buildAssistantResponse,
  FavoriteEntry,
  RecentSearchEntry,
  resolveIntent,
} from './assistantIntent';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
}

type ConversationState = { type: 'default' } | { type: 'train' } | { type: 'station' } | { type: 'journey'; from?: string };

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'Hi! I can help you find trains, stations, journeys, favorites, and recent searches.',
};

const QUICK_ACTIONS: { label: string; action: AssistantAction }[] = [
  { label: 'Find train', action: { type: 'trains' } },
  { label: 'Search station', action: { type: 'stations' } },
  { label: 'Plan journey', action: { type: 'journeys' } },
  { label: 'Favorites', action: { type: 'favorites' } },
  { label: 'Recent', action: { type: 'recent' } },
  { label: 'Help', action: { type: 'help' } },
];

/**
 * Mobile port of train-db-frontend's AssistantDialog.tsx, using the
 * byte-equivalent intent logic in assistantIntent.ts. Same conversational
 * flow (free-form text OR quick-action chips, multi-turn for
 * train/station/journey lookups), same navigation destinations - only the
 * chrome (Paper Modal instead of a fixed-position div) and the navigation
 * mechanism (navigationRef instead of next/navigation's router) differ.
 */
export function AssistantDialog({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  const favorites = useFavoritesStore();
  const { recent } = useHistoryStore();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [mode, setMode] = useState<ConversationState>({ type: 'default' });
  const [input, setInput] = useState('');

  const favoriteEntries: FavoriteEntry[] = [
    ...favorites.trains.map((t): FavoriteEntry => ({ type: 'train', trainNumber: t })),
    ...favorites.stations.map((s): FavoriteEntry => ({ type: 'station', stationCode: s })),
    ...favorites.routes.map((r): FavoriteEntry => {
      const [from, to] = r.split('-');
      return { type: 'route', fromStationName: from, toStationName: to };
    }),
  ];

  const recentEntries: RecentSearchEntry[] = recent.map((r): RecentSearchEntry => {
    if (r.type === 'journey') {
      const [from, to] = r.query.split('-');
      return { type: 'journey', fromName: from, toName: to };
    }
    if (r.type === 'train') return { type: 'train', trainNumber: r.query };
    return { type: 'station', stationCode: r.query };
  });

  function close() {
    setMessages([WELCOME]);
    setMode({ type: 'default' });
    setInput('');
    onDismiss();
  }

  function say(role: Message['role'], content: string) {
    setMessages((prev) => [...prev, { id: `${Date.now()}-${role}`, role, content }]);
  }

  function execute(action: AssistantAction) {
    const closeAfter = navigateFor(action);
    if (closeAfter) setTimeout(close, 400);
  }

  function navigateFor(action: AssistantAction): boolean {
    if (!navigationRef.isReady()) return false;

    switch (action.type) {
      case 'train':
        navigationRef.navigate('TrainsTab', { screen: 'TrainDetails', params: { trainNumber: action.trainNumber } } as never);
        return true;
      case 'station':
        navigationRef.navigate('StationsTab', { screen: 'StationDetails', params: { stationCode: action.stationCode } } as never);
        return true;
      case 'journey':
        navigationRef.navigate(
          'JourneysTab',
          { screen: 'JourneySearch', params: { from: action.from, to: action.to } } as never,
        );
        return true;
      case 'home':
        // Explicit `undefined` second argument, matching every other call
        // in this function - a bare single-argument call resolves to
        // `navigate`'s deprecated options-object overload instead of the
        // (name, params) form.
        navigationRef.navigate('HomeTab', undefined as never);
        return true;
      case 'trains':
        navigationRef.navigate('TrainsTab', { screen: 'TrainSearch' } as never);
        return true;
      case 'stations':
        navigationRef.navigate('StationsTab', { screen: 'StationSearch' } as never);
        return true;
      case 'journeys':
        navigationRef.navigate('JourneysTab', { screen: 'JourneySearch' } as never);
        return true;
      case 'rankings':
        navigationRef.navigate('ExploreTab', { screen: 'Rankings' } as never);
        return true;
      case 'funFacts':
        navigationRef.navigate('ExploreTab', { screen: 'FunFacts' } as never);
        return true;
      case 'achievements':
        navigationRef.navigate('ExploreTab', { screen: 'Achievements' } as never);
        return true;
      case 'network':
        navigationRef.navigate('ExploreTab', { screen: 'Network' } as never);
        return true;
      case 'stats':
        navigationRef.navigate('ExploreTab', { screen: 'Stats' } as never);
        return true;
      case 'smartSearch':
        navigationRef.navigate('ExploreTab', { screen: 'SmartSearch' } as never);
        return true;
      case 'admin':
        navigationRef.navigate('AccountTab', { screen: 'Admin' } as never);
        return true;
      case 'account':
        navigationRef.navigate('AccountTab', { screen: 'Account' } as never);
        return true;
      case 'developers':
        navigationRef.navigate('AccountTab', { screen: 'Developers' } as never);
        return true;
      case 'savedJourneys':
        navigationRef.navigate('JourneysTab', { screen: 'SavedJourneys' } as never);
        return true;
      default:
        return false;
    }
  }

  function handleSend(rawMessage: string) {
    const message = rawMessage.trim();
    if (!message) return;
    setInput('');

    if (mode.type !== 'default') {
      handleModeInput(message);
      return;
    }

    const action = resolveIntent(message);
    const response = buildAssistantResponse(action, favoriteEntries, recentEntries);
    say('user', message);
    say('assistant', response.message);
    execute(action);
  }

  function handleModeInput(message: string) {
    const value = message.trim();

    if (mode.type === 'train') {
      if (!value) return say('assistant', 'Please enter a train number or train name.');
      finishMode({ type: 'train', trainNumber: value }, value);
      return;
    }

    if (mode.type === 'station') {
      if (!value) return say('assistant', 'Please enter a station code or station name.');
      finishMode({ type: 'station', stationCode: value.toUpperCase() }, value);
      return;
    }

    if (mode.type === 'journey') {
      if (!mode.from) {
        if (!value) return say('assistant', 'Please enter your source station.');
        say('user', value);
        say('assistant', 'Where are you travelling to?');
        setMode({ type: 'journey', from: value });
        return;
      }
      if (!value) return say('assistant', 'Please enter your destination station.');
      finishMode({ type: 'journey', from: mode.from, to: value }, value);
      return;
    }
  }

  function finishMode(action: AssistantAction, userInput: string) {
    const response = buildAssistantResponse(action, favoriteEntries, recentEntries);
    say('user', userInput);
    say('assistant', response.message);
    execute(action);
    setMode({ type: 'default' });
  }

  function handleQuickAction(action: AssistantAction) {
    if (action.type === 'trains' || action.type === 'stations' || action.type === 'journeys') {
      // These map 1:1 to the free-form intents of the same name and
      // navigate immediately - no extra turn needed, matching web's
      // QuickActions behavior for these three.
    }

    const response = buildAssistantResponse(action, favoriteEntries, recentEntries);
    say('assistant', response.message);
    execute(action);
  }

  function startGuidedMode(kind: 'train' | 'station' | 'journey') {
    setMode({ type: kind });
    say('assistant', {
      train: 'Please enter a train number or train name.',
      station: 'Please enter a station code or station name.',
      journey: 'Which station are you travelling from?',
    }[kind]);
  }

  return (
    <Modal visible={visible} onDismiss={close} contentContainerStyle={styles.modal}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flexFull}>
        <View style={styles.header}>
          <Text variant="titleMedium">RailLens Assistant</Text>
          <IconButton icon="close" onPress={close} />
        </View>

        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          style={styles.messages}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
              <Text style={item.role === 'user' ? styles.userText : undefined}>{item.content}</Text>
            </View>
          )}
        />

        <View style={styles.chipsRow}>
          {QUICK_ACTIONS.map((qa) => (
            <Chip
              key={qa.label}
              onPress={() => {
                if (qa.action.type === 'trains') return startGuidedMode('train');
                if (qa.action.type === 'stations') return startGuidedMode('station');
                if (qa.action.type === 'journeys') return startGuidedMode('journey');
                handleQuickAction(qa.action);
              }}
              style={styles.chip}
            >
              {qa.label}
            </Chip>
          ))}
        </View>

        <View style={styles.inputRow}>
          <TextInput
            mode="outlined"
            placeholder="Ask RailLens..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleSend(input)}
            style={styles.input}
          />
          <IconButton icon="send" onPress={() => handleSend(input)} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { backgroundColor: 'white', margin: 16, borderRadius: 16, maxHeight: '80%', flex: 1 },
  flexFull: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  messages: { flexGrow: 0, paddingHorizontal: 12 },
  bubble: { padding: 10, borderRadius: 10, marginBottom: 8, maxWidth: '85%' },
  assistantBubble: { backgroundColor: '#eee', alignSelf: 'flex-start' },
  userBubble: { backgroundColor: '#0F62FE', alignSelf: 'flex-end' },
  userText: { color: 'white' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12, paddingBottom: 8 },
  chip: { marginBottom: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 8 },
  input: { flex: 1 },
});
