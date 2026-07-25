/**
 * useAutoLogout
 * ─────────────
 * Enforces a real, visible session timeout on the client, independent of
 * the JWT's own expiry. Token expiry + silent refresh (see api/client.ts)
 * keeps the *backend* session alive as long as the refresh token is valid —
 * but that's an implementation detail the user never sees, so a device
 * left open on a desk would otherwise stay "logged in" indefinitely.
 *
 * Officers and admins get a shorter timeout than visitors, since their
 * accounts can view national ID numbers and prisoner records.
 */
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '@stores/authStore';

const IDLE_TIMEOUT_MS: Record<string, number> = {
  VISITOR:        30 * 60 * 1000, // 30 minutes
  PRISON_OFFICER: 15 * 60 * 1000, // 15 minutes
  ADMIN:          15 * 60 * 1000, // 15 minutes
};
const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;

const getTimeoutForRole = (role?: string | null): number => {
  if (role && IDLE_TIMEOUT_MS[role] !== undefined) return IDLE_TIMEOUT_MS[role];
  return DEFAULT_TIMEOUT_MS;
};

export const useAutoLogout = () => {
  const user         = useAuthStore((s) => s.user);
  const accessToken   = useAuthStore((s) => s.accessToken);
  const clearAuth     = useAuthStore((s) => s.clearAuth);

  const appState         = useRef<AppStateStatus>(AppState.currentState);
  const backgroundedAt   = useRef<number | null>(null);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLoggedIn = !!accessToken;
  const timeoutMs  = getTimeoutForRole(user?.role);

  useEffect(() => {
    if (!isLoggedIn) {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      return;
    }

    checkIntervalRef.current = setInterval(() => {
      const idleFor = Date.now() - useAuthStore.getState().lastActiveAt;
      if (idleFor >= timeoutMs) {
        clearAuth();
      }
    }, 30_000);

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [isLoggedIn, timeoutMs, clearAuth]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/active/) && nextState.match(/inactive|background/)) {
        backgroundedAt.current = Date.now();
      }

      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        if (backgroundedAt.current && isLoggedIn) {
          const elapsed = Date.now() - backgroundedAt.current;
          if (elapsed >= timeoutMs) {
            clearAuth();
          }
        }
        backgroundedAt.current = null;
      }

      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [isLoggedIn, timeoutMs, clearAuth]);

  const registerActivity = () => {
    if (isLoggedIn) useAuthStore.getState().markActive();
  };

  return { registerActivity, timeoutMs };
};
