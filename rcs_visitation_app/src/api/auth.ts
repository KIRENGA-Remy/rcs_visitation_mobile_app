import client from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setSecure, clearAllSecure } from '@utils/secureStorage';
import { STORAGE_KEYS } from '@constants';
import type { LoginDto, RegisterDto, LoginResponse, AuthUser, ApiResponse } from '@types';
import * as Notifications from 'expo-notifications';

export const authApi = {
  register: async (dto: RegisterDto): Promise<LoginResponse> => {
    const res = await client.post<ApiResponse<LoginResponse>>('/auth/register', dto);
    return res.data.data!;
  },

  login: async (dto: LoginDto): Promise<LoginResponse> => {
    const res = await client.post<ApiResponse<LoginResponse>>('/auth/login', dto);
    const data = res.data.data!;
    // Tokens in SecureStore, user profile in AsyncStorage
    await setSecure(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
    await setSecure(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));

    try {
      const tokenResponse = await Notifications.getExpoPushTokenAsync();
      const expoPushToken = tokenResponse.data;

      if (expoPushToken) {
        // Axios interceptor automatically attaches JWT
        await client.post('/auth/push-token', { expoPushToken });
      }
    } catch (error) {
      console.warn('Failed to register Expo push token:', error);
    }

    return data;
  },

  getMe: async (): Promise<AuthUser> => {
    const res = await client.get<ApiResponse<AuthUser>>('/auth/me');
    return res.data.data!;
  },

  logout: async (): Promise<void> => {
    await clearAllSecure([STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.REFRESH_TOKEN]);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  },
};
