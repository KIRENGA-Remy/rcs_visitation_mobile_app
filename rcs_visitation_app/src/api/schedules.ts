import client from './client';
import type { VisitSchedule, ApiResponse } from '@types';

export const schedulesApi = {
  list: async (params?: { prisonId?: string; date?: string; visitType?: string; page?: number; limit?: number }) => {
    const res = await client.get<ApiResponse<VisitSchedule[]>>('/schedules', { params });
    return { data: res.data.data!, pagination: res.data.pagination };
  },

  /**
   * Admin/Officer management listing — unlike `list()` (built for visitors
   * browsing bookable slots), this shows every schedule regardless of
   * status or whether its time has passed, since an admin needs to see and
   * manage cancelled/past/full schedules too, not just currently-bookable
   * ones.
   */
  listForAdmin: async (params?: { prisonId?: string; status?: string; page?: number; limit?: number }) => {
    const res = await client.get<ApiResponse<VisitSchedule[]>>('/schedules/admin', { params });
    return { data: res.data.data!, pagination: res.data.pagination };
  },

  get: async (id: string): Promise<VisitSchedule> => {
    const res = await client.get<ApiResponse<VisitSchedule>>(`/schedules/${id}`);
    return res.data.data!;
  },

  create: async (body: {
    prisonId: string; date: string; startTime: string; endTime: string;
    label?: string; maxCapacity: number; visitType?: string; notes?: string;
  }): Promise<VisitSchedule> => {
    const res = await client.post<ApiResponse<VisitSchedule>>('/schedules', body);
    return res.data.data!;
  },

  update: async (id: string, body: {
    prisonId?: string; startTime?: string; endTime?: string; label?: string; maxCapacity?: number; notes?: string;
  }): Promise<VisitSchedule> => {
    const res = await client.put<ApiResponse<VisitSchedule>>(`/schedules/${id}`, body);
    return res.data.data!;
  },

  cancel: async (id: string): Promise<void> => {
    await client.patch(`/schedules/${id}/cancel`);
  },

  reopen: async (id: string): Promise<VisitSchedule> => {
    const res = await client.patch<ApiResponse<VisitSchedule>>(`/schedules/${id}/reopen`);
    return res.data.data!;
  },
};
