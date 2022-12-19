import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = path.resolve('test/fixtures/cypress');

test('Unused dependencies in cypress configuration', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['cypress.config.ts']['@nrwl/cypress/plugins/cypress-preset']);
  assert(issues.unlisted['cypress/support/commands.ts']['@faker-js/faker']);
  assert(issues.unlisted['cypress/support/e2e.ts']['@testing-library/cypress/add-commands']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 0,
    unlisted: 3,
    processed: 3,
    total: 3,
  });
});
