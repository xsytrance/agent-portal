import { describe, it, expect, mock } from 'bun:test';

mock.module('next/server', () => ({
  NextResponse: {
    next: () => ({}),
    json: () => ({}),
  }
}));

describe('secureCompare', () => {
  it('should return true for identical strings', async () => {
    const { secureCompare } = await import('./middleware');
    expect(secureCompare('password123', 'password123')).toBe(true);
    expect(secureCompare('', '')).toBe(true);
    expect(secureCompare('a', 'a')).toBe(true);
  });

  it('should return false for different strings of the same length', async () => {
    const { secureCompare } = await import('./middleware');
    expect(secureCompare('password123', 'password124')).toBe(false);
    expect(secureCompare('admin', 'root!')).toBe(false);
  });

  it('should return false for strings of different lengths', async () => {
    const { secureCompare } = await import('./middleware');
    expect(secureCompare('password', 'password123')).toBe(false);
    expect(secureCompare('12345', '1234')).toBe(false);
    expect(secureCompare('', 'a')).toBe(false);
  });

  it('should handle special characters', async () => {
    const { secureCompare } = await import('./middleware');
    expect(secureCompare('p@ssw0rd!', 'p@ssw0rd!')).toBe(true);
    expect(secureCompare('p@ssw0rd!', 'p@ssw0rd?')).toBe(false);
  });
});
