import { Platform } from 'react-native';
const LIVE_BASE_URL = 'https://raillens-train-db.onrender.com/api/v1';
const DEV_ANDROID_EMULATOR_BASE_URL = 'http://10.0.2.2:8080/api/v1';
const DEV_IOS_SIMULATOR_BASE_URL = 'http://localhost:8080/api/v1';
const USE_LOCAL_BACKEND = false;
export const API_BASE_URL = USE_LOCAL_BACKEND
  ? Platform.OS === 'android'
    ? DEV_ANDROID_EMULATOR_BASE_URL
    : DEV_IOS_SIMULATOR_BASE_URL
  : LIVE_BASE_URL;
export const WEB_BASE_URL = 'https://raillens.vercel.app';
