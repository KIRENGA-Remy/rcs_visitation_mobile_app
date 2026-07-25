import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { getSecure, clearAllSecure } from '@utils/secureStorage';
import { API_BASE_URL, STORAGE_KEYS } from '@constants';

const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// A separate, un-intercepted instance for the refresh call itself — using
// `client` here would recurse back into this same 401 handler if the
// refresh token has also expired.
const refreshClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// If several requests 401 at nearly the same moment, we want a single
// in-flight refresh call, not one per failed request. Every 401 handler
// awaits this same promise; only the first caller actually starts it.
let refreshPromise: Promise<string | null> | null = null;

const performTokenRefresh = async (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const storedRefreshToken = await getSecure(STORAGE_KEYS.REFRESH_TOKEN);
      if (!storedRefreshToken) return null;

      const { data } = await refreshClient.post('/auth/refresh', {
        refreshToken: storedRefreshToken,
      });
      const { accessToken, refreshToken: rotatedRefreshToken } = data.data;

      const { useAuthStore } = await import('@stores/authStore');
      await useAuthStore.getState().setTokens(accessToken, rotatedRefreshToken);

      return accessToken as string;
    } catch {
      return null; // refresh token itself is invalid/expired — caller must log out
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

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
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retriedAfterRefresh?: boolean }) | undefined;
    const isRefreshCall = originalRequest?.url?.includes('/auth/refresh');

    if (status === 401 && originalRequest && !originalRequest._retriedAfterRefresh && !isRefreshCall) {
      const newAccessToken = await performTokenRefresh();

      if (newAccessToken) {
        originalRequest._retriedAfterRefresh = true;
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return client(originalRequest);
      }

      await clearAllSecure([STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.REFRESH_TOKEN]);
      const { useAuthStore } = await import('@stores/authStore');
      useAuthStore.getState().clearAuth();
      return Promise.reject(new Error('Your session has expired. Please sign in again.'));
    }

    if (status === 401) {
      await clearAllSecure([STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.REFRESH_TOKEN]);
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
