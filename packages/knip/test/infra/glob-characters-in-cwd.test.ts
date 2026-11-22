import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

type Options = Parameters<typeof createOptions>[0];

// Absolute patterns and paths repeat the cwd, which may contain glob characters (e.g. `~/Dropbox (Team)/app`)
const fixtures: [string, Options][] = [
  ['fixtures/plugins/vite-public-custom', {}],
  ['fixtures/ignore/patterns-monorepo', {}],
  ['fixtures/ignore/issues', {}],
  ['fixtures/tags-hints/configuration-hints2', {}],
  ['fixtures/plugins/vitest', { isProduction: true }],
  ['fixtures/plugins/node-test-runner', { isProduction: true }],
  ['fixtures/resolution/subpath-import', {}],
  ['fixtures/resolution/tsconfig-include-dir', { isUseTscFiles: true }],
  ['fixtures/resolution/tsc-files-mode-svelte', { isUseTscFiles: true }],
  ['fixtures/imports/import-meta-glob-alias', {}],
  ['fixtures/plugins/nx', {}],
  ['fixtures/plugins/moonrepo', {}],
];

const run = async (cwd: string, options: Options) => {
  const { issues, counters, configurationHints } = await main(await createOptions({ ...options, cwd }));
  return JSON.parse(JSON.stringify({ issues, counters, configurationHints }).replaceAll(cwd, '<cwd>'));
};

for (const [fixture, options] of fixtures) {
  test(`Same results in a directory with glob characters: ${fixture}`, async () => {
    const expected = await run(resolve(fixture), options);
    const actual = await run(await copyFixture(fixture, 'knip (fixture) [x]-'), options);
    assert.deepEqual(actual, expected);
  });
}
