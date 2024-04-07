import { test } from 'bun:test';

import { publicFn, internalTestedFn } from './module';

test('public fn', () => {
  publicFn();
});

test('internal fn', () => {
  internalTestedFn();
});
