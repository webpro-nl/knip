import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/vitest9');

test('Find dependencies in vitest configuration (projects with inline and external)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  // Should detect unlisted dependencies from both inline and external project configurations
  // (external configs are loaded dynamically and dependencies attributed to main config)
  assert(issues.unlisted['vitest.config.ts']['jsdom']);
  assert(issues.unlisted['vitest.config.ts']['@vitest/coverage-v8']);
  assert(issues.unlisted['vitest.config.ts']['happy-dom']);
  assert(issues.unlisted['vitest.config.ts']['@vitest/coverage-istanbul']);

  // Should detect unresolved setup files from both inline and external project configurations
  // (external configs are loaded dynamically and setup files attributed to main config)
  assert(issues.unresolved['vitest.config.ts']['./src/unit.setup.ts']);
  assert(issues.unresolved['vitest.config.ts']['./src/integration.setup.ts']);
  assert(issues.unresolved['vitest.config.ts']['./src/global.setup.ts']);
  assert(issues.unresolved['vitest.config.ts']['./e2e-setup.ts']);
  assert(issues.unresolved['vitest.config.ts']['./spec-setup.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    devDependencies: 2,
    unlisted: 4,
    unresolved: 5,
    processed: 5,
    total: 5,
  });
});
