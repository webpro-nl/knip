import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/cypress');

test('Find dependencies and literal support entries with the Cypress plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unlisted['cypress.config.ts']['@nrwl/cypress']);
  assert(issues.unlisted['cypress/support/commands.ts']['@faker-js/faker']);
  assert(issues.unlisted['cypress/support/e2e.ts']['@testing-library/cypress']);
  assert.deepEqual(Object.keys(issues.files), ['cypress/support/v/setup.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 0,
    unlisted: 3,
    files: 1,
    processed: 5,
    total: 5,
  });
});
