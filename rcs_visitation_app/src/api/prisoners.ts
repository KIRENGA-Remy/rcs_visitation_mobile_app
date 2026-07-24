import client from './client';
import type { Prisoner, ApiResponse } from '@types';

export interface PrisonerSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  prisonerNumber: string;
  status: string;
  visitingRestricted: boolean;
  prison: { id: string; name: string; code: string };
}

export const prisonersApi = {
  list: async (params?: { prisonId?: string; status?: string; search?: string; page?: number; limit?: number }) => {
    const res = await client.get<ApiResponse<Prisoner[]>>('/prisoners', { params });
    return { data: res.data.data!, pagination: res.data.pagination };
  },

  /**
   * Visitor-facing search — GET /prisoners/search. Requires a prisonId
   * (search happens within one prison at a time, matching the intended
   * flow: pick a prison first, then find the prisoner inside it) and
   * returns only a limited, non-sensitive field set.
   */
  searchForVisitor: async (params: { prisonId: string; search?: string; page?: number; limit?: number }) => {
    const res = await client.get<ApiResponse<PrisonerSearchResult[]>>('/prisoners/search', { params });
    return { data: res.data.data!, pagination: res.data.pagination };
  },

  get: async (id: string): Promise<Prisoner> => {
    const res = await client.get<ApiResponse<Prisoner>>(`/prisoners/${id}`);
    return res.data.data!;
  },

  create: async (body: {
    prisonId: string; prisonerNumber: string; firstName: string; lastName: string;
    gender: string; dateOfBirth?: string; nationalId?: string; cellBlock?: string;
    cellNumber?: string; admissionDate: string; expectedReleaseDate?: string; offenseCategory?: string;
  }): Promise<Prisoner> => {
    const res = await client.post<ApiResponse<Prisoner>>('/prisoners', body);
    return res.data.data!;
  },

  update: async (id: string, body: {
    firstName?: string; lastName?: string; cellBlock?: string; cellNumber?: string;
    offenseCategory?: string; expectedReleaseDate?: string; nationalId?: string;
  }): Promise<Prisoner> => {
    const res = await client.put<ApiResponse<Prisoner>>(`/prisoners/${id}`, body);
    return res.data.data!;
  },

  release: async (id: string, releaseNotes?: string): Promise<Prisoner> => {
    const res = await client.patch<ApiResponse<Prisoner>>(`/prisoners/${id}/release`, { releaseNotes });
    return res.data.data!;
  },

  reactivate: async (id: string): Promise<Prisoner> => {
    const res = await client.patch<ApiResponse<Prisoner>>(`/prisoners/${id}/reactivate`);
    return res.data.data!;
  },

  transfer: async (id: string, body: { newPrisonId: string; transferNotes?: string }) => {
    const res = await client.patch<ApiResponse<Prisoner>>(`/prisoners/${id}/transfer`, body);
    return res.data.data!;
  },

  restrict: async (id: string, body: { restricted: boolean; restrictionReason?: string; restrictionUntil?: string }) => {
    const res = await client.patch<ApiResponse<Prisoner>>(`/prisoners/${id}/restrict`, body);
    return res.data.data!;
  },
};
