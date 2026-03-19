import client from './client';
import type { OverviewStats, DailyVisit, PeakHour, PrisonerActivity, ApiResponse } from '@types';

export const reportsApi = {
  overview: async (params?: { prisonId?: string }): Promise<OverviewStats> => {
    const res = await client.get<ApiResponse<OverviewStats>>('/reports/overview', { params });
    return res.data.data!;
  },

  dailyVisits: async (params?: { prisonId?: string; from?: string; to?: string }): Promise<DailyVisit[]> => {
    const res = await client.get<ApiResponse<DailyVisit[]>>('/reports/daily-visits', { params });
    return res.data.data!;
  },

  peakHours: async (params?: { prisonId?: string }): Promise<PeakHour[]> => {
    const res = await client.get<ApiResponse<PeakHour[]>>('/reports/peak-hours', { params });
    return res.data.data!;
  },

  prisonerActivity: async (params?: { prisonId?: string; limit?: number }): Promise<PrisonerActivity[]> => {
    const res = await client.get<ApiResponse<PrisonerActivity[]>>('/reports/prisoner-activity', { params });
    return res.data.data!;
  },
};
