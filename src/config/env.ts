import { Platform } from 'react-native';

/**
 * API base URL resolution. Mirrors train-db-frontend's
 * NEXT_PUBLIC_API_BASE_URL - same backend, same /api/v1 contract, no
 * duplicated business logic on the client.
 *
 * Running on a real phone (not an emulator/simulator) is a different
 * network than running on your dev machine - `localhost`/`10.0.2.2` only
 * ever reach a backend on the same computer as the emulator, never a
 * physical device on wifi/cellular. So once the backend is deployed
 * (train-db/render.yaml is ready for this - see the repo root's
 * MOBILE_FEATURE_PARITY.md / deployment notes), a real-device build should
 * point at the live URL, not localhost.
 *
 * There's no bundler-level env injection wired up yet (no react-native-config
 * dependency added - deliberately kept minimal for Phase 2/3). Swap this for
 * react-native-config or an EAS/Gradle build-time var once there's a real
 * staging/production split to manage.
 */

// TODO: replace with the actual Render URL once train-db is deployed
// (Render Blueprint at train-db/render.yaml -> "Apply" in the Render
// dashboard produces a URL like https://raillens-train-db.onrender.com).
const LIVE_BASE_URL = 'https://raillens-train-db.onrender.com/api/v1';

const DEV_ANDROID_EMULATOR_BASE_URL = 'http://10.0.2.2:8080/api/v1';
const DEV_IOS_SIMULATOR_BASE_URL = 'http://localhost:8080/api/v1';

/**
 * Flip this to true only when you're running an emulator/simulator on the
 * same machine as a locally-running `train-db` backend. Leave false for
 * testing on a real device, and for anything besides local backend
 * development - the live backend is the default so a fresh checkout
 * "just works" against the real deployment without extra setup.
 */
const USE_LOCAL_BACKEND = false;

export const API_BASE_URL = USE_LOCAL_BACKEND
  ? Platform.OS === 'android'
    ? DEV_ANDROID_EMULATOR_BASE_URL
    : DEV_IOS_SIMULATOR_BASE_URL
  : LIVE_BASE_URL;
