import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/railway');

test('Find Railway IaC entries and dependencies', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  assert(!('infra/provision.ts' in issues.files));
  assert(!('infra/jobs/process.ts' in issues.files));
  assert(!('tools/iac-runner.js' in issues.files));
  assert(!('services/inventory/scripts/deploy.ts' in issues.files));
  assert('scripts/deploy.ts' in issues.files);
  assert(!('services/storefront/scripts/build.ts' in issues.files));
  assert(!('services/storefront/src/serve.ts' in issues.files));
  assert('scripts/build.ts' in issues.files);
  assert('dashboard/start.ts' in issues.files);
  assert(issues.dependencies['package.json']['external-tool']);
  assert(!issues.dependencies['package.json']?.['drizzle-kit']);
  assert(!issues.dependencies['package.json']?.['storefront-tool']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    files: 3,
    processed: 10,
    total: 10,
  });
});
