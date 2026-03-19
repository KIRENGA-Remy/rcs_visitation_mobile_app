import client from './client';
import type { Prison, ApiResponse, PaginationMeta } from '@types';

export const prisonsApi = {
  list: async (params?: { page?: number; limit?: number; district?: string }) => {
    const res = await client.get<ApiResponse<Prison[]>>('/prisons', { params });
    return { data: res.data.data!, pagination: res.data.pagination };
  },

  get: async (id: string): Promise<Prison> => {
    const res = await client.get<ApiResponse<Prison>>(`/prisons/${id}`);
    return res.data.data!;
  },
};
