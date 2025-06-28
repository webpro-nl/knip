import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/cypress');

test('Find dependencies with the Cypress plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['cypress.config.ts']['@nrwl/cypress']);
  assert(issues.unlisted['cypress/support/commands.ts']['@faker-js/faker']);
  assert(issues.unlisted['cypress/support/e2e.ts']['@testing-library/cypress']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 0,
    unlisted: 3,
    processed: 3,
    total: 3,
  });
});
