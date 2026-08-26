export type AuthNavigation = {
  navigate: (screen: 'Login' | 'Register' | 'Account') => void;
};
export type TrainsStackParamList = {
  TrainSearch: undefined;
  TrainDetails: {
    trainNumber: string;
  };
};
export type StationsStackParamList = {
  StationSearch: undefined;
  StationDetails: {
    stationCode: string;
  };
};
export type JourneysStackParamList = {
  JourneySearch:
    | {
        from?: string;
        to?: string;
      }
    | undefined;
  SavedJourneys: undefined;
};
export type ExploreStackParamList = {
  SmartSearch: undefined;
  Rankings: undefined;
  FunFacts: undefined;
  Achievements: undefined;
  Network: undefined;
  Stats: undefined;
};
export type AccountStackParamList = {
  Account: undefined;
  Favorites: undefined;
  History: undefined;
  Settings: undefined;
  Admin: undefined;
  Developers: undefined;
  Login: undefined;
  Register: undefined;
};
export type HomeStackParamList = {
  Home: undefined;
};
export type MainTabParamList = {
  HomeTab: undefined;
  TrainsTab: undefined;
  StationsTab: undefined;
  JourneysTab: undefined;
  ExploreTab: undefined;
  AccountTab: undefined;
};
