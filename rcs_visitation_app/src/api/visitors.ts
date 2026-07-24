import client from './client';
import type { VisitorProfile, ApiResponse } from '@types';

export const visitorsApi = {
  getMyProfile: async (): Promise<VisitorProfile> => {
    const res = await client.get<ApiResponse<VisitorProfile>>('/visitors/me');
    return res.data.data!;
  },

  updateMyProfile: async (body: { district?: string; sector?: string; cell?: string; emergencyContactName?: string; emergencyContactPhone?: string }): Promise<VisitorProfile> => {
    const res = await client.put<ApiResponse<VisitorProfile>>('/visitors/me', body);
    return res.data.data!;
  },

  list: async (params?: { search?: string; isBanned?: boolean; page?: number; limit?: number }) => {
    const res = await client.get<ApiResponse<VisitorProfile[]>>('/visitors', { params });
    return { data: res.data.data!, pagination: res.data.pagination };
  },

  get: async (id: string): Promise<VisitorProfile> => {
    const res = await client.get<ApiResponse<VisitorProfile>>(`/visitors/${id}`);
    return res.data.data!;
  },

  ban: async (id: string, body: { isBanned: boolean; bannedReason?: string; bannedUntil?: string }) => {
    const res = await client.put<ApiResponse<VisitorProfile>>(`/visitors/${id}/ban`, body);
    return res.data.data!;
  },

  /** Visitor: request approval to visit a prisoner they aren't yet linked to. */
  requestContact: async (body: { prisonerId: string; relationship: string; notes?: string }) => {
    const res = await client.post<ApiResponse<any>>('/visitors/me/contact-requests', body);
    return res.data.data!;
  },

  /** Visitor: see the status of contact requests they've submitted (pending/approved/rejected). */
  getMyContactRequests: async (): Promise<ContactRequest[]> => {
    const res = await client.get<ApiResponse<ContactRequest[]>>('/visitors/me/contact-requests');
    return res.data.data!;
  },

  /** Admin/Officer: contact requests awaiting review. */
  getPendingContactRequests: async (params?: { page?: number; limit?: number }) => {
    const res = await client.get<ApiResponse<ContactRequest[]>>('/visitors/contact-requests/pending', { params });
    return { data: res.data.data!, pagination: res.data.pagination };
  },

  approveContactRequest: async (id: string) => {
    const res = await client.patch<ApiResponse<any>>(`/visitors/contact-requests/${id}/approve`);
    return res.data.data!;
  },

  rejectContactRequest: async (id: string, reason: string) => {
    const res = await client.patch<ApiResponse<any>>(`/visitors/contact-requests/${id}/reject`, { reason });
    return res.data.data!;
  },
};

export interface ContactRequest {
  id: string;
  relationship: string;
  approvedAt: string;      // creation/last-decision timestamp on this row
  approvedByUserId: string | null; // null == still pending review
  isActive: boolean;       // true == approved
  notes: string | null;    // rejection reason, when rejected
  prisoner: {
    id: string; firstName: string; lastName: string; prisonerNumber: string;
    prison: { name: string };
  };
  visitorProfile?: {
    user: { firstName: string; lastName: string; phone: string; nationalId?: string };
  };
}
