import * as Keychain from 'react-native-keychain';
const LEGACY_SERVICE = 'com.raillens.mobile.admin';
/**
 * Older builds kept the shared admin key in the Keychain. Admins now sign in with their own account, so delete
 * any copy left on the device (no-op if there is none).
 */
export async function forgetLegacyAdminKey(): Promise<void> {
  await Keychain.resetGenericPassword({ service: LEGACY_SERVICE });
}
