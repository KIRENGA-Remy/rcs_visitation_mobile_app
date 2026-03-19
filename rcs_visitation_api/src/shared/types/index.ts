import { Request } from 'express';
import { UserRole } from '@prisma/client';

// Augment Express Request to carry authenticated user
export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  email: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

// Standard API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
