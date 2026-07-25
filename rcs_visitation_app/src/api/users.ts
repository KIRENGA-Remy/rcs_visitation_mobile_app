import client from './client';
import type { UserAdmin, AuthUser, ApiResponse } from '@types';

export const usersApi = {
  /** Self-service — add/update own National ID, gender, DOB, photo, or language preference. */
  updateMe: async (body: {
    firstName?: string; lastName?: string; phone?: string;
    nationalId?: string; gender?: string; dateOfBirth?: string;
    profilePhoto?: string; preferredLang?: 'en' | 'rw';
  }): Promise<AuthUser> => {
    const res = await client.patch<ApiResponse<AuthUser>>('/users/me', body);
    return res.data.data!;
  },

  list: async (params?: { role?: string; status?: string; search?: string; page?: number; limit?: number }) => {
    const res = await client.get<ApiResponse<UserAdmin[]>>('/users', { params });
    return { data: res.data.data!, pagination: res.data.pagination };
  },

  get: async (id: string): Promise<UserAdmin> => {
    const res = await client.get<ApiResponse<UserAdmin>>(`/users/${id}`);
    return res.data.data!;
  },

  updateRole: async (id: string, role: string) => {
    const res = await client.put<ApiResponse<UserAdmin>>(`/users/${id}/role`, { role });
    return res.data.data!;
  },

  updateStatus: async (id: string, status: string) => {
    const res = await client.put<ApiResponse<UserAdmin>>(`/users/${id}/status`, { status });
    return res.data.data!;
  },

  /** Assign (or unassign with prisonId: null) which prison an officer works at. */
  assignPrison: async (id: string, prisonId: string | null) => {
    const res = await client.patch<ApiResponse<UserAdmin>>(`/users/${id}/assign-prison`, { prisonId });
    return res.data.data!;
  },

  /** Admin creates a Prison Officer account; officer sets their own password via emailed OTP. */
  createOfficer: async (body: {
    email: string; phone: string; firstName: string; lastName: string;
    nationalId?: string; assignedPrisonId?: string;
  }): Promise<{ user: UserAdmin; emailSent: boolean; setupOtp?: string }> => {
    const res = await client.post<ApiResponse<{ user: UserAdmin; emailSent: boolean; setupOtp?: string }>>('/users/officers', body);
    return res.data.data!;
  },

  /**
   * Admin creates ANOTHER admin account — a separate method hitting a
   * separate endpoint (/users/admins), not createOfficer with a role
   * parameter. See the backend schema comment for why: a single shared
   * "create staff, pick a role" form is exactly the kind of design that
   * lets a misclick grant admin privileges to what should've been an
   * officer account.
   */
  createAdmin: async (body: {
    email: string; phone: string; firstName: string; lastName: string; nationalId?: string;
  }): Promise<{ user: UserAdmin; emailSent: boolean; setupOtp?: string }> => {
    const res = await client.post<ApiResponse<{ user: UserAdmin; emailSent: boolean; setupOtp?: string }>>('/users/admins', body);
    return res.data.data!;
  },

  /** Public — officer enters their emailed OTP + chosen password to activate their account. */
  completeSetup: async (email: string, otp: string, newPassword: string): Promise<void> => {
    await client.post('/users/complete-setup', { email, otp, newPassword });
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/users/${id}`);
  },
};
