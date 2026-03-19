import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setSecure, getSecure, clearAllSecure } from '@utils/secureStorage';
import { STORAGE_KEYS } from '@constants';
import type { AuthUser } from '@types';

interface AuthState {
  user:        AuthUser | null;
  accessToken: string | null;
  language:    'en' | 'rw';
  isLoading:   boolean;
  isHydrated:  boolean;

  setAuth:     (user: AuthUser, accessToken: string, refreshToken: string) => Promise<void>;
  clearAuth:   () => Promise<void>;
  setUser:     (user: AuthUser) => void;
  setLanguage: (lang: 'en' | 'rw') => Promise<void>;
  hydrate:     () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:        null,
  accessToken: null,
  language:    'en',
  isLoading:   false,
  isHydrated:  false,

  setAuth: async (user, accessToken, refreshToken) => {
    // Tokens go to SecureStore (encrypted)
    await setSecure(STORAGE_KEYS.ACCESS_TOKEN,  accessToken);
    await setSecure(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    // User profile goes to AsyncStorage (may be large JSON)
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    set({ user, accessToken });
  },

  clearAuth: async () => {
    await clearAllSecure([STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.REFRESH_TOKEN]);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    set({ user: null, accessToken: null });
  },

  setUser: (user) => set({ user }),

  setLanguage: async (lang) => {
    await AsyncStorage.setItem('rcs_language', lang);
    set({ language: lang });
  },

  hydrate: async () => {
    try {
      const [token, userStr, lang] = await Promise.all([
        getSecure(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem('rcs_language'),
      ]);
      const user = userStr ? (JSON.parse(userStr) as AuthUser) : null;
      set({
        user,
        accessToken: token,
        language: (lang as 'en' | 'rw') ?? 'en',
        isHydrated: true,
      });
    } catch {
      set({ isHydrated: true });
    }
  },
}));
