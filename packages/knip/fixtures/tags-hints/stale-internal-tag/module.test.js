import { test } from 'node:test';
import { usedInTestInternal } from './module';

test('used in test', () => {
  usedInTestInternal();
});
