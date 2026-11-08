import assert from 'node:assert/strict';
import { rm, writeFile } from 'node:fs/promises';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugin-config/basic');

test('Use root plugin config', async () => {
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    total: 3,
    processed: 3,
  });
});

test('Treat undefined plugin config like an absent key', async () => {
  const cwd = await copyFixture('fixtures/plugin-config/basic');
  try {
    await rm(join(cwd, 'knip.json'));
    await writeFile(
      join(cwd, 'knip.ts'),
      `export default {
  vite: undefined,
  workspaces: {
    '.': {
      vite: undefined,
      vitest: { config: undefined, entry: ['**/*.vitest.ts'], project: undefined },
    },
  },
};
`
    );
    const options = await createOptions({ cwd });
    const { counters } = await main(options);

    assert.deepEqual(counters, {
      ...baseCounters,
      total: 4,
      processed: 4,
    });
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
