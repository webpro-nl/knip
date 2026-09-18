vi.mock(import('../src/pool.js'), () => ({
  getPool: () => ({}),
}));

vi.mock(import('../src/auto-mocked.js'));

vi.mock(import('../src/import-original.js'), async importOriginal => ({
  ...(await importOriginal()),
}));

vi.mock(import('../src/import-actual.js'), async () => {
  const actual = await vi.importActual('../src/import-actual.js');
  return { ...actual };
});

function shadow(vi: { mock: (...args: unknown[]) => void }) {
  vi.mock(import('../src/shadowed.js'), () => ({}));
}

import { test, vi } from 'vitest';
import '../src/consumer.js';

test('uses pool', () => {});
