// @vitest-environment node
// @vitest-environment ./local-env.js

/**
 * @vitest-environment happy-dom
 * @jest-environment jsdom
 */

import 'vitest';

test('ehm comments & environments overload', () => {
  const element = document.createElement('div');
  expect(element).not.toBeNull();
});
