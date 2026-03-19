import client from './client';
import type { VisitSchedule, ApiResponse } from '@types';

export const schedulesApi = {
  list: async (params?: { prisonId?: string; date?: string; visitType?: string; page?: number; limit?: number }) => {
    const res = await client.get<ApiResponse<VisitSchedule[]>>('/schedules', { params });
    return { data: res.data.data!, pagination: res.data.pagination };
  },

  get: async (id: string): Promise<VisitSchedule> => {
    const res = await client.get<ApiResponse<VisitSchedule>>(`/schedules/${id}`);
    return res.data.data!;
  },

  cancel: async (id: string): Promise<void> => {
    await client.patch(`/schedules/${id}/cancel`);
  },
};
