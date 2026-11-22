import { expect, test } from 'vitest';
import { createClient } from './generated/client.ts';

test('create a client', () => {
  expect(createClient()).toBe(1);
});
