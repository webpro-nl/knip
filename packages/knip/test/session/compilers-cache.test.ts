import assert from 'node:assert/strict';
import { readFile, rm, writeFile } from 'node:fs/promises';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createSession } from '../../src/session/session.ts';
import { join } from '../../src/util/path.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { createOptions } from '../helpers/create-options.ts';

test('Invalidate persistent compiler facts when a cached session source changes', async () => {
  const cwd = await copyFixture('fixtures/session-compilers');
  const filePath = join(cwd, 'selection.foo');
  const callsPath = join(cwd, 'selection.foo.calls');

  try {
    const options = await createOptions({ cwd, args: { cache: true } });
    await main(options);
    const sessionOptions = await createOptions({ cwd, args: { cache: true }, isSession: true });
    const session = await createSession(sessionOptions);

    assert.deepEqual(Object.keys(session.getIssues().issues.exports['fruits.ts']), ['banana']);
    assert.equal(await readFile(callsPath, 'utf8'), 'apple\n');

    await writeFile(filePath, 'banana\n');
    await session.handleFileChanges([{ type: 'modified', filePath }]);

    assert.deepEqual(Object.keys(session.getIssues().issues.exports['fruits.ts']), ['apple']);
    assert.equal(await readFile(callsPath, 'utf8'), 'apple\nbanana\n');
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
