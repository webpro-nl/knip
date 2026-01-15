import { sharedFunction } from '../src/index';
import { it, expect } from 'bun:test';

it('lib', () => {
  expect(sharedFunction()).toBe('shared');
});
