import client from './client';
import type { ApiResponse } from '@types';

export interface OfficerReport {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  fileUrl: string;
  fileMimeType: string;
  fileSizeBytes: number;
  visitLogId?: string;
  reportRequestId?: string;
  createdAt: string;
  updatedAt: string;
  officer?: { firstName: string; lastName: string };
  reportRequest?: { title: string };
}

/** A locally-picked document (from expo-document-picker) ready to upload. */
export interface PickedDocument {
  uri: string;
  name: string;
  mimeType: string;
}

export const officerReportsApi = {
  /** Officer uploads a report through the app — multipart/form-data, backend relays it to Cloudinary. */
  create: async (
    meta: { title: string; description?: string; visitLogId?: string; reportRequestId?: string },
    file: PickedDocument
  ): Promise<OfficerReport> => {
    const form = new FormData();
    Object.entries(meta).forEach(([key, value]) => { if (value) form.append(key, value); });
    form.append('file', { uri: file.uri, name: file.name, type: file.mimeType } as any);

    const res = await client.post<ApiResponse<OfficerReport>>('/officer-reports', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data!;
  },

  /**
   * Alternative to uploading through the app — the officer already has the
   * document hosted somewhere (their own Cloudinary account, Google Drive,
   * etc.) and just pastes the link.
   */
  createFromUrl: async (body: {
    title: string; description?: string; visitLogId?: string; reportRequestId?: string;
    fileUrl: string; fileName: string;
  }): Promise<OfficerReport> => {
    const res = await client.post<ApiResponse<OfficerReport>>('/officer-reports/from-url', body);
    return res.data.data!;
  },

  myReports: async (params?: { page?: number; limit?: number }) => {
    const res = await client.get<ApiResponse<OfficerReport[]>>('/officer-reports/my', { params });
    return { data: res.data.data!, pagination: res.data.pagination };
  },

  /** Admin: every submitted report, optionally filtered to one officer. */
  listAll: async (params?: { officerId?: string; page?: number; limit?: number }) => {
    const res = await client.get<ApiResponse<OfficerReport[]>>('/officer-reports', { params });
    return { data: res.data.data!, pagination: res.data.pagination };
  },

  get: async (id: string): Promise<OfficerReport> => {
    const res = await client.get<ApiResponse<OfficerReport>>(`/officer-reports/${id}`);
    return res.data.data!;
  },

  update: async (id: string, body: { title?: string; description?: string }): Promise<OfficerReport> => {
    const res = await client.put<ApiResponse<OfficerReport>>(`/officer-reports/${id}`, body);
    return res.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/officer-reports/${id}`);
  },
};
