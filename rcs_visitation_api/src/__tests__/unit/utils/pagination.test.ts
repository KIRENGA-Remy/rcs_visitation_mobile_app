/**
 * Unit Tests: Pagination Utility
 */
import { parsePagination } from '../../../shared/utils/pagination';
import { buildPagination } from '../../../shared/utils/apiResponse';

describe('parsePagination', () => {
  it('defaults to page 1, limit 20', () => {
    const result = parsePagination({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.skip).toBe(0);
  });

  it('calculates correct skip for page 3 limit 10', () => {
    const result = parsePagination({ page: 3, limit: 10 });
    expect(result.skip).toBe(20);
  });

  it('clamps limit to max 100', () => {
    const result = parsePagination({ limit: 999 });
    expect(result.limit).toBe(100);
  });

  it('clamps page to minimum 1 for negative input', () => {
    const result = parsePagination({ page: -5 });
    expect(result.page).toBe(1);
  });

  it('handles string inputs from query params', () => {
    const result = parsePagination({ page: '2' as any, limit: '15' as any });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(15);
    expect(result.skip).toBe(15);
  });
});

describe('buildPagination', () => {
  it('calculates totalPages correctly', () => {
    const meta = buildPagination(1, 10, 25);
    expect(meta.totalPages).toBe(3);
  });

  it('sets hasNext true when not on last page', () => {
    const meta = buildPagination(1, 10, 25);
    expect(meta.hasNext).toBe(true);
    expect(meta.hasPrev).toBe(false);
  });

  it('sets hasPrev true when past first page', () => {
    const meta = buildPagination(2, 10, 25);
    expect(meta.hasPrev).toBe(true);
  });

  it('sets hasNext false on last page', () => {
    const meta = buildPagination(3, 10, 25);
    expect(meta.hasNext).toBe(false);
  });

  it('handles zero total', () => {
    const meta = buildPagination(1, 20, 0);
    expect(meta.totalPages).toBe(0);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrev).toBe(false);
  });
});
