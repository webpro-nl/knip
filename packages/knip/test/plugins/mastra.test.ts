import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/mastra');

test('Find dependencies with the Mastra plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('src/mastra/agents/support/lib/format.ts' in issues.files);
  assert('src/mastra/tools/weather-tool.test.ts' in issues.files);
  assert('lib/unused.ts' in issues.files);

  // `mastra dev --dir app/mastra` discovers that folder instead of `src/mastra`
  assert(!('app/mastra/index.ts' in issues.files));
  assert(!('app/mastra/agents/bot/tools/ping.ts' in issues.files));
  assert(!('app/lib/ping.ts' in issues.files));

  // `mastra build -t lib/tools/*.ts,lib/extra-tools` bundles each match as a tool entry
  assert(!('lib/tools/alpha.ts' in issues.files));
  assert(!('lib/shared.ts' in issues.files));
  assert(!('lib/extra-tools/index.ts' in issues.files));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 3,
    processed: 23,
    total: 23,
  });
});
