import { test, expect } from 'vitest';
import { user } from '@fixtures/user';

test('client e2e test', () => {
  expect(user).toBe(true);
});
