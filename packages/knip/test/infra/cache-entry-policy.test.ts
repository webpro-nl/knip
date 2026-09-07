import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';

test('Cached files respect entry export policy changes', async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'knip-entry-policy-'));
  const cacheLocation = mkdtempSync(join(tmpdir(), 'knip-cache-'));
  const run = async () => main(await createOptions({ cwd, args: { cache: true, 'cache-location': cacheLocation } }));

  mkdirSync(join(cwd, 'src'));
  writeFileSync(join(cwd, 'package.json'), '{"scripts":{"custom":"node src/custom.js"}}');
  writeFileSync(join(cwd, 'knip.json'), '{"includeEntryExports":true,"project":["src/**/*.js"]}');
  writeFileSync(join(cwd, 'src/custom.js'), 'export const unused = true;\n', { flag: 'wx' });

  try {
    assert.equal((await run()).counters.exports, 0);

    writeFileSync(
      join(cwd, 'knip.json'),
      '{"includeEntryExports":true,"entry":["src/custom.js"],"project":["src/**/*.js"]}'
    );
    assert.equal((await run()).counters.exports, 1);

    writeFileSync(join(cwd, 'knip.json'), '{"includeEntryExports":true,"project":["src/**/*.js"]}');
    assert.equal((await run()).counters.exports, 0);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
    rmSync(cacheLocation, { recursive: true, force: true });
  }
});
