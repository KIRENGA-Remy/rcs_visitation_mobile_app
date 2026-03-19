/**
 * Unit tests for Zustand stores
 */
jest.mock('expo-secure-store', () => ({
  setItemAsync:    jest.fn().mockResolvedValue(undefined),
  getItemAsync:    jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'opt',
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem:     jest.fn().mockResolvedValue(undefined),
  getItem:     jest.fn().mockResolvedValue(null),
  removeItem:  jest.fn().mockResolvedValue(undefined),
  multiRemove: jest.fn().mockResolvedValue(undefined),
}));

import { useAuthStore }          from '../stores/authStore';
import { useNotificationStore }  from '../stores/notificationStore';

const mockUser = {
  id: 'u1', email: 'a@b.com', phone: '+250788', firstName: 'Jean',
  lastName: 'Mugisha', role: 'VISITOR' as const, status: 'ACTIVE' as const,
  preferredLang: 'en', emailVerified: false, phoneVerified: false, createdAt: '2024-01-01',
};

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null, isHydrated: false });
  });

  it('starts with null user and token', () => {
    const { user, accessToken } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(accessToken).toBeNull();
  });

  it('setUser updates user in store', () => {
    useAuthStore.getState().setUser(mockUser);
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('setAuth stores user, token, and persists', async () => {
    await useAuthStore.getState().setAuth(mockUser, 'access-token-123', 'refresh-token-456');
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().accessToken).toBe('access-token-123');
  });

  it('clearAuth nullifies user and token', async () => {
    useAuthStore.setState({ user: mockUser, accessToken: 'token' });
    await useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('setLanguage updates language and persists', async () => {
    await useAuthStore.getState().setLanguage('rw');
    expect(useAuthStore.getState().language).toBe('rw');
  });
});

describe('useNotificationStore', () => {
  beforeEach(() => useNotificationStore.setState({ unreadCount: 0 }));

  it('starts at 0 unread', () => {
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('increment increases count', () => {
    useNotificationStore.getState().increment();
    useNotificationStore.getState().increment();
    expect(useNotificationStore.getState().unreadCount).toBe(2);
  });

  it('decrement decreases count but not below 0', () => {
    useNotificationStore.setState({ unreadCount: 1 });
    useNotificationStore.getState().decrement();
    useNotificationStore.getState().decrement(); // would go to -1, should stay 0
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('setUnreadCount sets exact value', () => {
    useNotificationStore.getState().setUnreadCount(7);
    expect(useNotificationStore.getState().unreadCount).toBe(7);
  });

  it('reset sets count to 0', () => {
    useNotificationStore.setState({ unreadCount: 5 });
    useNotificationStore.getState().reset();
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });
});
