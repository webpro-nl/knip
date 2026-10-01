import { expect, test } from 'vitest';
import { add, subtract } from './math.ts';

test('add and subtract', () => {
  expect(subtract(add(1, 2), 2)).toBe(1);
});
