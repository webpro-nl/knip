import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';

const cwd = resolve('fixtures/plugins/cypress-multi-reporter');

test('Exclude built-in cypress reporters from dependency checks', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(!issues.unlisted['cypress.config.ts']['junit']);
});
