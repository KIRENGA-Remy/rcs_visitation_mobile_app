/**
 * Secure Storage Wrapper
 * ─────────────────────
 * Uses Expo SecureStore for sensitive tokens (encrypted at rest on device).
 * Falls back to AsyncStorage for non-sensitive data that may exceed
 * SecureStore's 2048-byte limit (e.g. user profile JSON).
 */
import * as SecureStore from 'expo-secure-store';
import AsyncStorage    from '@react-native-async-storage/async-storage';

/** Store a JWT token securely */
export const setSecure = async (key: string, value: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch {
    // Fallback (e.g. simulator without keychain)
    await AsyncStorage.setItem(key, value);
  }
};

/** Read a securely stored value */
export const getSecure = async (key: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return AsyncStorage.getItem(key);
  }
};

/** Delete a securely stored value */
export const deleteSecure = async (key: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    await AsyncStorage.removeItem(key);
  }
};

/** Clear all secure tokens (on logout) */
export const clearAllSecure = async (keys: string[]): Promise<void> => {
  await Promise.all(keys.map(deleteSecure));
};
