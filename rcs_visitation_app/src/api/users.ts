import client from './client';
import type { UserAdmin, AuthUser, ApiResponse } from '@types';

export const usersApi = {
  /** Self-service — add/update own National ID, gender, DOB, photo, or language preference. */
  updateMe: async (body: { nationalId?: string; gender?: string; dateOfBirth?: string; profilePhoto?: string; preferredLang?: 'en' | 'rw' }): Promise<AuthUser> => {
    const res = await client.patch<ApiResponse<AuthUser>>('/users/me', body);
    return res.data.data!;
  },

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
