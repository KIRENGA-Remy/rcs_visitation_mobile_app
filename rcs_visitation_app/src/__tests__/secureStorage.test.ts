/**
 * Unit tests for secureStorage wrapper
 * Mocks both SecureStore and AsyncStorage
 */
jest.mock('expo-secure-store', () => ({
  setItemAsync:    jest.fn().mockResolvedValue(undefined),
  getItemAsync:    jest.fn().mockResolvedValue('mock-token'),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'when_unlocked_this_device_only',
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem:    jest.fn().mockResolvedValue(undefined),
  getItem:    jest.fn().mockResolvedValue('fallback-value'),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

import * as SecureStore  from 'expo-secure-store';
import AsyncStorage      from '@react-native-async-storage/async-storage';
import { setSecure, getSecure, deleteSecure, clearAllSecure } from '../utils/secureStorage';

describe('secureStorage', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('setSecure', () => {
    it('calls SecureStore.setItemAsync', async () => {
      await setSecure('rcs_access_token', 'my-jwt');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'rcs_access_token', 'my-jwt',
        expect.objectContaining({ keychainAccessible: expect.any(String) })
      );
    });

    it('falls back to AsyncStorage on error', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(new Error('Keychain unavailable'));
      await setSecure('rcs_access_token', 'my-jwt');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('rcs_access_token', 'my-jwt');
    });
  });

  describe('getSecure', () => {
    it('reads from SecureStore', async () => {
      const result = await getSecure('rcs_access_token');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('rcs_access_token');
      expect(result).toBe('mock-token');
    });

    it('falls back to AsyncStorage on error', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('Unavailable'));
      const result = await getSecure('rcs_access_token');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('rcs_access_token');
    });
  });

  describe('clearAllSecure', () => {
    it('deletes all provided keys', async () => {
      await clearAllSecure(['key1', 'key2', 'key3']);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(3);
    });
  });
});
