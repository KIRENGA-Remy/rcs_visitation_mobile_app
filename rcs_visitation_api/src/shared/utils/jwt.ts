import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AuthenticatedUser } from '../types';

export const signAccessToken = (payload: AuthenticatedUser): string =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);

export const signRefreshToken = (userId: string): string =>
  jwt.sign({ userId }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);

export const verifyAccessToken = (token: string): AuthenticatedUser =>
  jwt.verify(token, env.JWT_SECRET) as AuthenticatedUser;

export const verifyRefreshToken = (token: string): { userId: string } =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
