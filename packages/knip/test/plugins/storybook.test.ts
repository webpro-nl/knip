import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { createOptions } from '../../src/util/create-options.js';
import baseCounters from '../helpers/baseCounters.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/storybook');

test('Find dependencies with the Storybook plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

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
