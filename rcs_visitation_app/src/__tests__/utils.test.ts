import {
  formatDate, formatTime, formatDuration,
  getInitials, truncate, extractApiError,
} from '../utils';

describe('formatDate', () => {
  it('formats a valid ISO date string', () => {
    const result = formatDate('2024-06-15T09:00:00Z');
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/2024/);
  });

  it('returns — for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('—');
  });
});

describe('formatTime', () => {
  it('formats time portion correctly', () => {
    const result = formatTime('2024-06-15T09:30:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(3);
  });
});

describe('formatDuration', () => {
  it('shows minutes under an hour', () => {
    expect(formatDuration(45)).toBe('45m');
  });

  it('shows hours correctly', () => {
    expect(formatDuration(60)).toBe('1h');
  });

  it('shows hours and minutes', () => {
    expect(formatDuration(90)).toBe('1h 30m');
  });
});

describe('getInitials', () => {
  it('returns two uppercase initials', () => {
    expect(getInitials('Amina', 'Uwase')).toBe('AU');
  });

  it('returns uppercase for single name', () => {
    expect(getInitials('Jean', '')).toBe('J');
  });

  it('handles empty strings gracefully', () => {
    const result = getInitials('', '');
    expect(typeof result).toBe('string');
  });
});

describe('truncate', () => {
  it('does not truncate short strings', () => {
    expect(truncate('Hello')).toBe('Hello');
  });

  it('truncates long strings and adds ellipsis', () => {
    const long = 'a'.repeat(100);
    const result = truncate(long, 50);
    expect(result.length).toBeLessThanOrEqual(52);
    expect(result.endsWith('…')).toBe(true);
  });
});

describe('extractApiError', () => {
  it('extracts message from axios error response', () => {
    const err = { response: { data: { message: 'Visitor is banned' } } };
    expect(extractApiError(err)).toBe('Visitor is banned');
  });

  it('falls back to err.message', () => {
    const err = { message: 'Network Error' };
    expect(extractApiError(err)).toBe('Network Error');
  });

  it('returns generic message for unknown errors', () => {
    expect(extractApiError({})).toBe('Something went wrong. Please try again.');
  });
});
