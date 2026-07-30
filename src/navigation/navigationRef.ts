import { createNavigationContainerRef } from '@react-navigation/native';

/**
 * Lets code outside the React tree (the Assistant, which is mounted as a
 * sibling overlay to NavigationContainer rather than a screen - see
 * RootNavigator.tsx) trigger navigation the same way a screen's
 * `navigation` prop would, without threading a nav object through props.
 * Standard React Navigation pattern for this exact situation.
 *
 * Typed `<any>` deliberately: the callers here navigate across tabs using
 * the nested `navigate(tab, { screen, params })` form (same as
 * HomeScreen.tsx's `useNavigation<any>()`), which the top-level
 * MainTabParamList (tabs typed `undefined`) can't express without piping
 * every nested stack's param list through this one ref.
 */
export const navigationRef = createNavigationContainerRef<any>();
