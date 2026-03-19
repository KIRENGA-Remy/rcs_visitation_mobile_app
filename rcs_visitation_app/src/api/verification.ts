import client from './client';
import type { ApiResponse } from '@types';

export const verificationApi = {
  scan: async (qrCode: string) => {
    const res = await client.post<ApiResponse<any>>('/verification/scan', { qrCode });
    return res.data.data!;
  },

  getStatus: async (visitRequestId: string) => {
    const res = await client.get<ApiResponse<any>>(`/verification/${visitRequestId}`);
    return res.data.data!;
  },
};
