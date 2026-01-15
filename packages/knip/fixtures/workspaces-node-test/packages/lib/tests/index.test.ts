import { sharedFunction } from '../src/index';
import { it } from 'node:test';
import assert from 'node:assert/strict';

it('lib', () => {
  assert.strictEqual(sharedFunction(), 'shared');
});
