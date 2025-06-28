import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { join, resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/jest');

test('Find dependencies with the Jest plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['jest.config.shared.js']['@jest/types']);
  assert(issues.unlisted['jest.setup.js']['@testing-library/jest-dom']);
  assert(issues.unlisted['jest.config.js']['@jest/types']);
  assert(issues.unresolved['jest.config.js']['@side/jest-runtime']);
  assert(issues.unresolved['jest.config.js']['@nrwl/react/plugins/jest']);
  assert(issues.unresolved['jest.config.js']['babel-jest']);
  assert(issues.unresolved['jest.config.js']['identity-obj-proxy']);
  assert(issues.unresolved['jest.config.js']['jest-junit']);
  assert(issues.unresolved['jest.config.js']['jest-phabricator']);
  assert(issues.unresolved['jest.config.js']['jest-runner-eslint']);
  assert(issues.unresolved['jest.config.js']['jest-silent-reporter']);
  assert(issues.unresolved['jest.config.js'][join(cwd, '__mocks__/fileMock.js')]);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unlisted: 3,
    unresolved: 9,
    processed: 7,
    total: 7,
  });
});
