import { test } from 'bun:test';

import { publicFn, internalTestedFn } from './module';

/** @param {import('./module').UsedViaJSDoc} config */
function configure(config) {}

test('public fn', () => {
  publicFn();
});

test('internal fn', () => {
  internalTestedFn();
});
