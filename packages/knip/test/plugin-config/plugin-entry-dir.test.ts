import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import { main } from '../../src/index.ts';
import { type Input, toEntry, toProductionEntry } from '../../src/util/input.ts';
import { join } from '../../src/util/path.ts';
import { WorkspaceWorker } from '../../src/WorkspaceWorker.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugin-config/plugin-entry-dir');
const app = join(cwd, 'packages/app');

// Plugin inputs are injected into one workspace's worker, so the spelling, base and group of a pattern are exact
const run = async (t: TestContext, inputs: Input[], { isProduction = false, workspace = '.' } = {}) => {
  const runPlugins = t.mock.method(WorkspaceWorker.prototype, 'runPlugins', async function (this: WorkspaceWorker) {
    return this.name === workspace ? inputs : [];
  });
  try {
    return await main(await createOptions({ cwd, isProduction }));
  } finally {
    runPlugins.mock.restore();
  }
};

const spellings = {
  'relative positive, relative negative': ['*.ts', '!skip.ts'],
  'relative positive, absolute negative': ['*.ts', `!${app}/skip.ts`],
  'absolute positive, relative negative': [`${app}/*.ts`, '!skip.ts'],
  'absolute positive, absolute negative': [`${app}/*.ts`, `!${app}/skip.ts`],
};

for (const [spelling, patterns] of Object.entries(spellings)) {
  test(`Resolve plugin entry patterns from dir (${spelling})`, async t => {
    const inputs = patterns.map(pattern => ({ ...toEntry(pattern), dir: app }));
    const { issues, counters } = await run(t, inputs);

    assert.deepEqual(Object.keys(issues.files).sort(), ['keep.ts', 'packages/app/skip.ts', 'skip.ts']);
    assert.deepEqual(counters, { ...baseCounters, files: 3, processed: 4, total: 4 });
  });

  test(`Resolve plugin production entry patterns from dir (${spelling})`, async t => {
    const inputs = patterns.map(pattern => toProductionEntry(pattern, { dir: app }));
    const { issues, counters } = await run(t, inputs, { isProduction: true });

    assert.deepEqual(Object.keys(issues.files).sort(), ['keep.ts', 'packages/app/skip.ts', 'skip.ts']);
    assert.deepEqual(counters, { ...baseCounters, files: 3, processed: 4, total: 4 });
  });
}
