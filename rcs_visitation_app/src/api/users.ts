import client from './client';
import type { UserAdmin, ApiResponse } from '@types';

export const usersApi = {
  list: async (params?: { role?: string; status?: string; search?: string; page?: number; limit?: number }) => {
    const res = await client.get<ApiResponse<UserAdmin[]>>('/users', { params });
    return { data: res.data.data!, pagination: res.data.pagination };
  },

  get: async (id: string): Promise<UserAdmin> => {
    const res = await client.get<ApiResponse<UserAdmin>>(`/users/${id}`);
    return res.data.data!;
  },

  updateRole: async (id: string, role: string) => {
    const res = await client.put<ApiResponse<UserAdmin>>(`/users/${id}/role`, { role });
    return res.data.data!;
  },

  updateStatus: async (id: string, status: string) => {
    const res = await client.put<ApiResponse<UserAdmin>>(`/users/${id}/status`, { status });
    return res.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/users/${id}`);
  },
};
