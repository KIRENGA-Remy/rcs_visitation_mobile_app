import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@api/notifications';
import { useNotificationStore } from '@stores/notificationStore';
import { QUERY_KEYS } from '@constants';

export const useNotifications = (params?: { page?: number; unreadOnly?: boolean }) =>
  useQuery({
    queryKey: [...QUERY_KEYS.NOTIFICATIONS, params],
    queryFn:  () => notificationsApi.list(params),
    staleTime: 30 * 1000,
  });

export const useUnreadCount = () => {
  const { setUnreadCount } = useNotificationStore();

  const query = useQuery({
    queryKey:       QUERY_KEYS.UNREAD_COUNT,
    queryFn:        notificationsApi.unreadCount,
    refetchInterval: 30 * 1000,
    // ── onSuccess was REMOVED in TanStack Query v5 ──────────────────────────
    // It silently did nothing. The fix is to sync the store in useEffect
    // watching query.data, which fires every time data changes.
  });

  // Sync server count → local Zustand store whenever data arrives
  useEffect(() => {
    if (query.data !== undefined) {
      setUnreadCount(query.data);
    }
  }, [query.data, setUnreadCount]);

  return query;
};

export const useMarkRead = () => {
  const qc = useQueryClient();
  const { decrement } = useNotificationStore();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.UNREAD_COUNT });
      decrement();
    },
  });
};

export const useMarkAllRead = () => {
  const qc = useQueryClient();
  const { reset } = useNotificationStore();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.UNREAD_COUNT });
      reset();
    },
  });
};

