import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { getSecure, clearAllSecure } from '@utils/secureStorage';
import { API_BASE_URL, STORAGE_KEYS } from '@constants';

const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// ── Request interceptor — attach JWT from SecureStore ────────────────────
client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Check connectivity before sending
    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      return Promise.reject(
        Object.assign(new Error('NO_INTERNET'), { isOffline: true })
      );
    }

    const token = await getSecure(STORAGE_KEYS.ACCESS_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — friendly errors, auto-logout on 401 ───────────
client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError & { isOffline?: boolean }) => {
    if (error.isOffline) {
      return Promise.reject(new Error('No internet connection. Please check your network and try again.'));
    }

    if (!error.response) {
      // Network error / timeout
      if (error.code === 'ECONNABORTED') {
        return Promise.reject(new Error('Request timed out. The server is taking too long to respond.'));
      }
      return Promise.reject(new Error('Cannot connect to server. Please check your internet connection.'));
    }

    const status = error.response.status;

    if (status === 401) {
      // Token expired — clear credentials so RootNavigator re-routes to Auth
      await clearAllSecure([STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.REFRESH_TOKEN]);
      // Dynamically import to avoid circular deps
      const { useAuthStore } = await import('@stores/authStore');
      useAuthStore.getState().clearAuth();
      return Promise.reject(new Error('Your session has expired. Please sign in again.'));
    }

    if (status === 403) {
      return Promise.reject(new Error('You do not have permission to perform this action.'));
    }

    if (status === 404) {
      return Promise.reject(new Error('The requested resource was not found.'));
    }

    if (status === 409) {
      const msg = (error.response.data as any)?.message;
      return Promise.reject(new Error(msg ?? 'A conflict occurred. This record may already exist.'));
    }

    if (status === 422) {
      const msg = (error.response.data as any)?.message;
      return Promise.reject(new Error(msg ?? 'Invalid data. Please check your input and try again.'));
    }

    if (status >= 500) {
      return Promise.reject(new Error('Server error. Our team has been notified. Please try again shortly.'));
    }

    // Pass through any specific backend message
    const backendMsg = (error.response.data as any)?.message;
    return Promise.reject(new Error(backendMsg ?? 'Something went wrong. Please try again.'));
  }
);

export default client;
