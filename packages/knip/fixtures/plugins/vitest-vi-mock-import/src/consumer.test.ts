import { vi, test } from 'vitest';
import { getPool } from './consumer.js';
getPool();

vi.mock(import('./pool.js'), () => ({
  getPool: () => ({}),
}));

test('uses pool', () => {});
