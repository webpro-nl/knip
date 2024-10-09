import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/cypress-multi-reporter');

test('Find dependencies with the cypress-multi-reporter plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['cypress.config.ts']['@nrwl/cypress/plugins/cypress-preset']);
  assert(issues.unlisted['cypress/support/commands.ts']['@faker-js/faker']);
  assert(issues.unlisted['cypress/support/e2e.ts']['@testing-library/cypress/add-commands']);
  assert(issues.unlisted['cypress.config.ts']['@testing-library/my-fake-reporter']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 0,
    unlisted: 4,
    unresolved: 3,
    processed: 3,
    total: 3,
  });
});
