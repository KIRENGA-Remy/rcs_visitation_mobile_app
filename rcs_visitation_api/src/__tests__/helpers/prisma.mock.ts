/**
 * Prisma Mock Helper
 * ─────────────────
 * Creates a fully typed jest mock of PrismaClient so tests never
 * touch a real database. Uses jest-mock-extended for deep mocking.
 *
 * Usage in tests:
 *   jest.mock('../../config/prisma', () => ({ prisma: prismaMock }));
 */
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

export const prismaMock = mockDeep<PrismaClient>();

// Reset all mocks between tests
beforeEach(() => mockReset(prismaMock));

export type PrismaMock = DeepMockProxy<PrismaClient>;
