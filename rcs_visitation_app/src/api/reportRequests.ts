import client from './client';
import type { ApiResponse } from '@types';

export interface ReportRequest {
  id: string;
  title: string;
  message?: string;
  status: 'PENDING' | 'FULFILLED';
  targetOfficerId?: string;
  createdAt: string;
  requestedBy?: { firstName: string; lastName: string };
  targetOfficer?: { firstName: string; lastName: string };
  reports?: { id: string }[];
}

export const reportRequestsApi = {
  /** Admin: request a report from one specific officer, or every officer (omit targetOfficerId). */
  create: async (body: { targetOfficerId?: string | null; title: string; message?: string }): Promise<ReportRequest> => {
    const res = await client.post<ApiResponse<ReportRequest>>('/report-requests', body);
    return res.data.data!;
  },

  /** Admin: every request they've sent. */
  list: async (params?: { status?: string; page?: number; limit?: number }) => {
    const res = await client.get<ApiResponse<ReportRequest[]>>('/report-requests', { params });
    return { data: res.data.data!, pagination: res.data.pagination };
  },

  /** Officer: requests addressed to them, or broadcast to all officers. */
  myRequests: async (params?: { page?: number; limit?: number }) => {
    const res = await client.get<ApiResponse<ReportRequest[]>>('/report-requests/my', { params });
    return { data: res.data.data!, pagination: res.data.pagination };
  },
};
