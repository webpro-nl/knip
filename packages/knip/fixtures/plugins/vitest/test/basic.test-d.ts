import { expectTypeOf, test } from 'vitest';

test('Type B', () => {
  expectTypeOf(Math.sqrt(4)).toEqualTypeOf<number>();
});
