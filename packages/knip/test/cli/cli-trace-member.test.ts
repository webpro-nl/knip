import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/namespaces/ts-namespace');

const fruits = `members.ts:Fruits
└── index.ts:import[Fruits] ⎆ ✓
      refs: [Fruits.apple, Fruits.Tropical, Fruits.Tropical.mango]
    members: [apple ✓, unusedBanana ✗, Tropical.mango ✓, Tropical.unusedPapaya ✗]`;

test('trace resolves a bare namespace-member name to its enclosing namespace', () => {
  assert.equal(exec('knip --trace-export unusedBanana --trace-file members.ts', { cwd }).stdout, fruits);
});

test('trace resolves a nested namespace-member name to its enclosing namespace', () => {
  assert.equal(exec('knip --trace-export Tropical.unusedPapaya --trace-file members.ts', { cwd }).stdout, fruits);
});
