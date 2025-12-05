import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/dependencies');

test('knip --trace', () => {
  const actual = exec('knip --trace', { cwd }).stdout;
  const expected = `my-module.ts:program
└── entry.ts:import[program] ◯ ✓
my-module.ts:default
└── entry.ts:importAs[default → has] ◯ ✓`;

  assert.equal(actual, expected);
});

test('knip --trace-export program', () => {
  const actual = exec('knip --trace-export program', { cwd }).stdout;
  const expected = `my-module.ts:program
└── entry.ts:import[program] ◯ ✓`;

  assert.equal(actual, expected);
});

test('knip --trace-file my-module.ts', () => {
  const actual = exec('knip --trace-file my-module.ts', { cwd }).stdout;
  const expected = `my-module.ts:program
└── entry.ts:import[program] ◯ ✓
my-module.ts:default
└── entry.ts:importAs[default → has] ◯ ✓`;

  assert.equal(actual, expected);
});
