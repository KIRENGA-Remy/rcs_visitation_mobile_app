import client from './client';
import type { Notification, ApiResponse } from '@types';

export const notificationsApi = {
  list: async (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
    const res = await client.get<ApiResponse<Notification[]>>('/notifications', { params });
    return { data: res.data.data!, pagination: res.data.pagination };
  },

  unreadCount: async (): Promise<number> => {
    const res = await client.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count');
    return res.data.data!.unreadCount;
  },

  markRead: async (id: string): Promise<void> => {
    await client.patch(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await client.patch('/notifications/mark-all-read');
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/notifications/${id}`);
  },

  deleteAll: async (): Promise<{ deletedCount: number }> => {
    const res = await client.delete<ApiResponse<{ deletedCount: number }>>('/notifications/all');
    return res.data.data!;
  },
};
