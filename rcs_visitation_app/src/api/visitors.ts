import client from './client';
import type { VisitorProfile, ApiResponse } from '@types';

export const visitorsApi = {
  getMyProfile: async (): Promise<VisitorProfile> => {
    const res = await client.get<ApiResponse<VisitorProfile>>('/visitors/me');
    return res.data.data!;
  },

  updateMyProfile: async (body: { district?: string; sector?: string; cell?: string; emergencyContactName?: string; emergencyContactPhone?: string }): Promise<VisitorProfile> => {
    const res = await client.put<ApiResponse<VisitorProfile>>('/visitors/me', body);
    return res.data.data!;
  },

  list: async (params?: { search?: string; isBanned?: boolean; page?: number; limit?: number }) => {
    const res = await client.get<ApiResponse<VisitorProfile[]>>('/visitors', { params });
    return { data: res.data.data!, pagination: res.data.pagination };
  },

  get: async (id: string): Promise<VisitorProfile> => {
    const res = await client.get<ApiResponse<VisitorProfile>>(`/visitors/${id}`);
    return res.data.data!;
  },

  ban: async (id: string, body: { isBanned: boolean; bannedReason?: string; bannedUntil?: string }) => {
    const res = await client.put<ApiResponse<VisitorProfile>>(`/visitors/${id}/ban`, body);
    return res.data.data!;
  },
};
