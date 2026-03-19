import client from './client';
import type { VisitLog, CheckInDto, CheckOutDto, ApiResponse } from '@types';

export const visitLogsApi = {
  checkIn: async (dto: CheckInDto): Promise<VisitLog> => {
    const res = await client.post<ApiResponse<VisitLog>>('/visit-logs/check-in', dto);
    return res.data.data!;
  },

  checkOut: async (logId: string, dto: CheckOutDto): Promise<VisitLog> => {
    const res = await client.patch<ApiResponse<VisitLog>>(`/visit-logs/${logId}/check-out`, dto);
    return res.data.data!;
  },

  list: async (params?: { prisonId?: string; date?: string; flagged?: boolean; page?: number; limit?: number }) => {
    const res = await client.get<ApiResponse<VisitLog[]>>('/visit-logs', { params });
    return { data: res.data.data!, pagination: res.data.pagination };
  },

  get: async (id: string): Promise<VisitLog> => {
    const res = await client.get<ApiResponse<VisitLog>>(`/visit-logs/${id}`);
    return res.data.data!;
  },
};
