/**
 * Direct port of train-db-frontend/lib/assistantIntent.ts - pure
 * intent-resolution and response-generation logic, no React/navigation.
 * Kept byte-for-byte equivalent in behavior (same regexes, same message
 * copy) so the assistant behaves identically on both platforms; only the
 * "closeAfterAction"-driven navigation wiring differs (see AssistantDialog
 * on both platforms).
 */

export interface FavoriteEntry {
  type: 'train' | 'station' | 'route';
  trainNumber?: string;
  trainName?: string;
  stationCode?: string;
  stationName?: string;
  fromStationName?: string;
  toStationName?: string;
}

export interface RecentSearchEntry {
  type: 'train' | 'station' | 'journey';
  trainNumber?: string;
  trainName?: string;
  stationCode?: string;
  stationName?: string;
  fromName?: string;
  toName?: string;
}

export type AssistantAction =
  | { type: 'train'; trainNumber: string }
  | { type: 'station'; stationCode: string }
  | { type: 'journey'; from: string; to: string }
  | { type: 'favorites' }
  | { type: 'recent' }
  | { type: 'help' }
  | { type: 'home' }
  | { type: 'trains' }
  | { type: 'stations' }
  | { type: 'journeys' }
  | { type: 'unknown'; query: string };

export interface AssistantResponse {
  message: string;
  closeAfterAction?: boolean;
}

const helpResponses: Record<string, string> = {
  trains:
    'Use the Train Search tab to search by train number or train name. Select a train to view its schedule, route, and other details.',
  stations:
    'Use the Station Search tab to search by station name or station code. You can view station details and trains passing through that station.',
  journey:
    'Use the Journeys tab to find trains between two stations. Enter your source and destination stations to see available trains.',
  favorites: 'Tap the star icon on a train or station to save it as a favorite. Your favorites are stored locally on your device.',
  recent: 'RailLens automatically saves your recent train, station, and journey searches for quick access.',
  railLens:
    'RailLens is a railway information system that helps you search trains, stations, journeys, favorites, and recent searches.',
};

export function resolveIntent(query: string): AssistantAction {
  const input = query.trim();

  if (/^\d{5}$/.test(input)) {
    return { type: 'train', trainNumber: input };
  }

  if (/^[A-Za-z]{2,5}$/.test(input)) {
    return { type: 'station', stationCode: input.toUpperCase() };
  }

  const journeyMatch = input.match(/^(.+?)\s+to\s+(.+)$/i);
  if (journeyMatch) {
    return { type: 'journey', from: journeyMatch[1].trim(), to: journeyMatch[2].trim() };
  }

  if (/favorite/i.test(input)) return { type: 'favorites' };
  if (/recent/i.test(input)) return { type: 'recent' };
  if (/help|what can you do/i.test(input)) return { type: 'help' };
  if (/search.*train|find.*train|train search/i.test(input)) return { type: 'unknown', query: 'help:trains' };
  if (/station search|search.*station|find.*station/i.test(input)) return { type: 'unknown', query: 'help:stations' };
  if (/journey|plan.*trip|plan.*journey/i.test(input)) return { type: 'unknown', query: 'help:journey' };
  if (/raillens/i.test(input)) return { type: 'unknown', query: 'help:raillens' };

  return { type: 'unknown', query: input };
}

export function buildAssistantResponse(
  action: AssistantAction,
  favorites: FavoriteEntry[],
  recentSearches: RecentSearchEntry[],
): AssistantResponse {
  switch (action.type) {
    case 'train':
      return { message: `Opening train ${action.trainNumber}...`, closeAfterAction: true };
    case 'station':
      return { message: `Opening station ${action.stationCode}...`, closeAfterAction: true };
    case 'journey':
      return { message: `Searching journeys from ${action.from} to ${action.to}...`, closeAfterAction: true };
    case 'home':
      return { message: 'Opening Home...', closeAfterAction: true };
    case 'trains':
      return { message: 'Opening Train Search...', closeAfterAction: true };
    case 'stations':
      return { message: 'Opening Station Search...', closeAfterAction: true };
    case 'journeys':
      return { message: 'Opening Journey Search...', closeAfterAction: true };

    case 'favorites':
      return {
        message:
          favorites.length === 0
            ? 'You have no favorite trains or stations.'
            : favorites
                .map((item) =>
                  item.type === 'train'
                    ? `🚆 ${item.trainNumber}`
                    : item.type === 'station'
                      ? `📍 ${item.stationCode}`
                      : `🗺 ${item.fromStationName ?? ''} → ${item.toStationName ?? ''}`,
                )
                .join('\n'),
      };

    case 'recent':
      return {
        message:
          recentSearches.length === 0
            ? 'You have no recent searches.'
            : recentSearches
                .map((item) => {
                  switch (item.type) {
                    case 'train':
                      return `🚆 ${item.trainNumber ?? ''}`;
                    case 'station':
                      return `📍 ${item.stationCode ?? ''}`;
                    case 'journey':
                      return `🗺 ${item.fromName ?? ''} → ${item.toName ?? ''}`;
                  }
                })
                .join('\n'),
      };

    case 'help':
      return {
        message:
          'I can help you with:\n\n' +
          '• Search trains\n' +
          '• Search stations\n' +
          '• Plan journeys\n' +
          '• View favorites\n' +
          '• View recent searches\n\n' +
          'You can also ask:\n"How do I search trains?"',
      };

    case 'unknown': {
      switch (action.query) {
        case 'help:trains':
          return { message: helpResponses.trains };
        case 'help:stations':
          return { message: helpResponses.stations };
        case 'help:journey':
          return { message: helpResponses.journey };
        case 'help:favorites':
          return { message: helpResponses.favorites };
        case 'help:recent':
          return { message: helpResponses.recent };
        case 'help:raillens':
          return { message: helpResponses.railLens };
        default:
          return {
            message:
              "I didn't quite understand that.\n\nI can help you search trains, stations, journeys, favorites, recent searches, and navigate RailLens.",
          };
      }
    }

    default:
      return {
        message:
          "Sorry, I didn't understand that.\n\nTry:\n• 12141\n• KYN\n• Mumbai to Pune\n• Show favorites\n• Recent searches",
      };
  }
}
