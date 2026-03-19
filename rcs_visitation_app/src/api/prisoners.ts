import client from './client';
import type { Prisoner, ApiResponse } from '@types';

export const prisonersApi = {
  list: async (params?: { prisonId?: string; status?: string; search?: string; page?: number; limit?: number }) => {
    const res = await client.get<ApiResponse<Prisoner[]>>('/prisoners', { params });
    return { data: res.data.data!, pagination: res.data.pagination };
  },

  get: async (id: string): Promise<Prisoner> => {
    const res = await client.get<ApiResponse<Prisoner>>(`/prisoners/${id}`);
    return res.data.data!;
  },

  transfer: async (id: string, body: { newPrisonId: string; transferNotes?: string }) => {
    const res = await client.patch<ApiResponse<Prisoner>>(`/prisoners/${id}/transfer`, body);
    return res.data.data!;
  },

  restrict: async (id: string, body: { restricted: boolean; restrictionReason?: string; restrictionUntil?: string }) => {
    const res = await client.patch<ApiResponse<Prisoner>>(`/prisoners/${id}/restrict`, body);
    return res.data.data!;
  },
};
