/**
 * Minimal shape LoginScreen/RegisterScreen actually need from their
 * `navigation` prop (just navigate between the two). Kept deliberately
 * narrower than a full param-list type so both the standalone auth flow
 * and the nested Login/Register screens inside AccountStackParamList can
 * render the same two screen components without a type mismatch -
 * React Navigation's navigation objects satisfy this structurally.
 */
export type AuthNavigation = {
  // 'Account' added so LoginScreen/RegisterScreen can return there after a
  // successful sign-in - previously neither screen navigated anywhere on
  // success, so the app just sat on the auth form until the user manually
  // tapped the Account tab again. Reported 2026-08-06.
  //
  // navigate('Account'), not goBack(): Register is reachable both directly
  // from Account *and* via Login ("Create an account" link), so the stack
  // depth to pop varies. React Navigation's stack navigator already pops
  // back to an existing route rather than pushing a duplicate when you
  // navigate() to a screen already in the stack, which handles both entry
  // paths correctly - goBack() would only undo one step, landing back on
  // Login instead of Account for the Login -> Register path.
  navigate: (screen: 'Login' | 'Register' | 'Account') => void;
};

export type TrainsStackParamList = {
  TrainSearch: undefined;
  TrainDetails: { trainNumber: string };
};

export type StationsStackParamList = {
  StationSearch: undefined;
  StationDetails: { stationCode: string };
};

export type JourneysStackParamList = {
  JourneySearch: { from?: string; to?: string } | undefined;
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
  // Nested here (not a separate root-level stack) so logging in/out never
  // needs to swap the whole navigator tree - see RootNavigator's note on
  // why the app doesn't gate on auth at all. Same two screens as the web
  // app's /login and /register routes.
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
