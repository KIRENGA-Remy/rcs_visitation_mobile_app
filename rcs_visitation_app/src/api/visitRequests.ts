import client from './client';
import type { VisitRequest, CreateVisitRequestDto, ApiResponse } from '@types';

export const visitRequestsApi = {
  create: async (dto: CreateVisitRequestDto): Promise<VisitRequest> => {
    const res = await client.post<ApiResponse<VisitRequest>>('/visit-requests', dto);
    return res.data.data!;
  },

  myRequests: async (params?: { status?: string; page?: number; limit?: number }) => {
    const res = await client.get<ApiResponse<VisitRequest[]>>('/visit-requests/my', { params });
    return { data: res.data.data!, pagination: res.data.pagination };
  },

  get: async (id: string): Promise<VisitRequest> => {
    const res = await client.get<ApiResponse<VisitRequest>>(`/visit-requests/${id}`);
    return res.data.data!;
  },

  byPrison: async (prisonId: string, params?) => {
    const endpoint = prisonId
      ? `/visit-requests/prison/${prisonId}`
      : `/visit-requests/prison/all`;
    const res = await client.get<ApiResponse<VisitRequest[]>>(endpoint, { params });
    return { data: res.data.data!, pagination: res.data.pagination };
  },

  process: async (id: string, body: { action: 'APPROVE' | 'REJECT'; rejectionReason?: string }): Promise<VisitRequest> => {
    const res = await client.patch<ApiResponse<VisitRequest>>(`/visit-requests/${id}/process`, body);
    return res.data.data!;
  },

  cancel: async (id: string, cancellationReason: string): Promise<VisitRequest> => {
    const res = await client.patch<ApiResponse<VisitRequest>>(`/visit-requests/${id}/cancel`, { cancellationReason });
    return res.data.data!;
  },
};
