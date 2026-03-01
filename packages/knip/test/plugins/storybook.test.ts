import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/storybook');

test('Find dependencies with the Storybook plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['storybook-addon-performance']);
  assert(issues.unlisted['.storybook/main.js']['@storybook/addon-knobs']);
  assert(issues.unlisted['.storybook/main.js']['@storybook/builder-webpack5']);
  assert(issues.unlisted['.storybook/main.js']['@storybook/manager-webpack5']);
  assert(issues.unlisted['.storybook/main.js']['@storybook/react-webpack5']);
  assert(issues.unlisted['.storybook/preview.js']['cypress-storybook']);
  assert(issues.unlisted['.storybook/vitest.setup.ts']['@storybook/your-framework']);
  assert(issues.unresolved['.storybook/main.js']['storybook-addon-export-to-codesandbox']);
  assert(issues.binaries['package.json']['storybook']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unlisted: 6,
    unresolved: 1,
    binaries: 1,
    processed: 4,
    total: 4,
  });
});
