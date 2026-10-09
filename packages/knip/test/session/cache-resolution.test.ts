import assert from 'node:assert/strict';
import { mkdtempSync, realpathSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createSession } from '../../src/session/session.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';

test('Session validates cached resolutions when import targets are added and deleted', async () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-session-cache-')));
  const cacheLocation = mkdtempSync(join(tmpdir(), 'knip-cache-'));
  const args = { cache: true, 'cache-location': cacheLocation };
  const filePath = join(cwd, 'banana.ts');
  writeFileSync(join(cwd, 'package.json'), '{"name":"orchard"}');
  writeFileSync(join(cwd, 'index.ts'), "import { banana } from './banana';\nconsole.log(banana);\n");

  try {
    assert.equal((await main(await createOptions({ cwd, args }))).counters.unresolved, 1);

    const session = await createSession(await createOptions({ cwd, args, isSession: true }));
    assert.deepEqual(Object.keys(session.getIssues().issues.unresolved['index.ts']), ['./banana']);

    writeFileSync(filePath, 'export const banana = 1;\n');
    await session.handleFileChanges([{ type: 'added', filePath }]);
    const added = session.getIssues();
    assert.equal(added.counters.unresolved, 0);
    assert.equal(added.counters.files, 0);
    assert.equal(added.counters.exports, 0);

    unlinkSync(filePath);
    await session.handleFileChanges([{ type: 'deleted', filePath }]);
    assert.deepEqual(Object.keys(session.getIssues().issues.unresolved['index.ts']), ['./banana']);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
    rmSync(cacheLocation, { recursive: true, force: true });
  }
});
