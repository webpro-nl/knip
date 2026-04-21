import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/sveltejs-package');

test('Find dependencies with the @sveltejs/package plugin (defaults)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('src/tools/dev-only.ts' in issues.files);
  assert(!('src/lib/auth.ts' in issues.files));
  assert(!('src/lib/session.ts' in issues.files));
  assert(!('src/lib/index.ts' in issues.files));
  assert(!('src/lib/ui/button/index.ts' in issues.files));
  assert(!('src/lib/ui/button/button.ts' in issues.files));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 6,
    total: 6,
  });
});

test('Find dependencies with the @sveltejs/package plugin (custom -i/-o)', async () => {
  const cwd2 = resolve('fixtures/plugins/sveltejs-package2');
  const options = await createOptions({ cwd: cwd2 });
  const { issues, counters } = await main(options);

  assert('src/orphan.ts' in issues.files);
  assert(!('src/components/index.ts' in issues.files));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 2,
    total: 2,
  });
});
