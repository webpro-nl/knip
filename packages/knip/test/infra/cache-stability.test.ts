import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import { version } from '../../src/version.ts';
import { createOptions } from '../helpers/create-options.ts';

test('Cache file does not grow across warm runs with workspace package imports', async () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-cache-stability-')));
  const cacheLocation = mkdtempSync(join(tmpdir(), 'knip-cache-'));
  const run = async () => main(await createOptions({ cwd, args: { cache: true, 'cache-location': cacheLocation } }));
  const rootCacheSize = () => {
    const name = readdirSync(cacheLocation).find(name => name.startsWith('root-'));
    assert.ok(name);
    return statSync(join(cacheLocation, name)).size;
  };

  mkdirSync(join(cwd, 'packages/apples'), { recursive: true });
  mkdirSync(join(cwd, 'packages/pears'), { recursive: true });
  writeFileSync(join(cwd, 'package.json'), '{"name":"orchard","workspaces":["packages/*"]}');
  writeFileSync(
    join(cwd, 'packages/apples/package.json'),
    '{"name":"apples","main":"index.ts","dependencies":{"pears":"*"}}'
  );
  writeFileSync(join(cwd, 'packages/apples/index.ts'), "import { pear } from 'pears';\nconsole.log(pear);\n");
  writeFileSync(join(cwd, 'packages/pears/package.json'), '{"name":"pears","main":"index.ts"}');
  writeFileSync(join(cwd, 'packages/pears/index.ts'), 'export const pear = 1;\n');

  try {
    assert.equal((await run()).counters.unlisted, 0);
    const cold = rootCacheSize();
    await run();
    assert.equal(rootCacheSize(), cold);
    await run();
    assert.equal(rootCacheSize(), cold);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
    rmSync(cacheLocation, { recursive: true, force: true });
  }
});

test('Production and strict runs keep separate cache files', async () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-cache-stability-')));
  const cacheLocation = mkdtempSync(join(tmpdir(), 'knip-cache-'));
  const run = async (args: { production?: boolean; strict?: boolean }) =>
    main(await createOptions({ cwd, args: { cache: true, 'cache-location': cacheLocation, ...args } }));
  writeFileSync(join(cwd, 'package.json'), '{"name":"orchard"}');
  writeFileSync(join(cwd, 'index.ts'), 'export {};\n');

  try {
    await run({ production: true });
    await run({ production: true, strict: true });
    const rootCaches = readdirSync(cacheLocation).filter(name => name.startsWith('root-'));
    assert.deepEqual(rootCaches.sort(), [`root--prod-${version}`, `root--prod-strict-${version}`]);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
    rmSync(cacheLocation, { recursive: true, force: true });
  }
});
