import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/storybook');

test('Find dependencies with the Storybook plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.devDependencies['package.json']['storybook-addon-performance']);
  assert(issues.unlisted['.storybook/main.js']['@storybook/builder-webpack5']);
  assert(issues.unlisted['.storybook/main.js']['@storybook/manager-webpack5']);
  assert(issues.unlisted['.storybook/main.js']['@storybook/react-webpack5']);
  assert(issues.unlisted['.storybook/preview.js']['cypress-storybook']);
  assert(issues.unlisted['.storybook/vitest.setup.ts']['@storybook/your-framework']);
  assert(issues.unresolved['.storybook/main.js']['@storybook/addon-knobs/preset']);
  assert(issues.unresolved['.storybook/main.js']['storybook-addon-export-to-codesandbox']);
  assert(issues.binaries['package.json']['storybook']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unlisted: 5,
    unresolved: 2,
    binaries: 1,
    processed: 4,
    total: 4,
  });
});
