import { expectTypeOf, test } from 'vitest';

test('Type A', () => {
  expectTypeOf(Math.sqrt(4)).toEqualTypeOf<number>();
});
