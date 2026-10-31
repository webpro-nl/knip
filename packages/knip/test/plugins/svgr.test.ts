import assert from 'node:assert/strict';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { dirname, join } from '../../src/util/path.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Find dependencies with the svgr plugin', async () => {
  const cwd = resolve('fixtures/plugins/svgr');
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 0,
    total: 0,
  });
});

for (const configFile of [
  '.svgrrc.cjs',
  '.svgrrc.mjs',
  '.svgrrc.ts',
  '.config/svgrrc',
  '.config/svgrrc.yaml',
  '.config/svgrrc.cjs',
  'svgr.config.ts',
  'svgr.config.mjs',
]) {
  test(`Find SVGR dependencies in ${configFile}`, async () => {
    const cwd = await copyFixture('fixtures/plugins/svgr');
    const json = await readFile(join(cwd, '.svgrrc'), 'utf8');
    const isScript = /\.[cm]?[jt]s$/.test(configFile);
    const content = isScript ? `${configFile.endsWith('.cjs') ? 'module.exports =' : 'export default'} ${json};` : json;
    await rm(join(cwd, '.svgrrc'));
    const configPath = join(cwd, configFile);
    await mkdir(dirname(configPath), { recursive: true });
    await writeFile(configPath, content);
    await writeFile(join(cwd, 'unused.ts'), 'export {};');

    const options = await createOptions({ cwd });
    const { issues, counters } = await main(options);

    assert.deepEqual(Object.keys(issues.files), ['unused.ts']);
    assert.deepEqual(counters, {
      ...baseCounters,
      files: 1,
      processed: isScript ? 2 : 1,
      total: isScript ? 2 : 1,
    });
  });
}
