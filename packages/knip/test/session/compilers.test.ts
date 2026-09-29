import assert from 'node:assert/strict';
import { readFile, rm, writeFile } from 'node:fs/promises';
import test from 'node:test';
import { createSession } from '../../src/session/session.ts';
import { join } from '../../src/util/path.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { createOptions } from '../helpers/create-options.ts';

test('Recompile async sources after changes and failures, skipping unchanged raw source', async () => {
  const cwd = await copyFixture('fixtures/session-compilers');
  const filePath = join(cwd, 'selection.foo');
  const callsPath = join(cwd, 'selection.foo.calls');

  try {
    await writeFile(join(cwd, 'unused.ts'), 'export const unused = true;\n');
    const options = await createOptions({ cwd, isSession: true });
    const session = await createSession(options);

    assert.deepEqual(Object.keys(session.getIssues().issues.exports['fruits.ts']), ['banana']);
    assert.deepEqual(Object.keys(session.getIssues().issues.files), ['unused.ts']);
    assert.equal(await readFile(callsPath, 'utf8'), 'apple\n');

    assert.equal(await session.handleFileChanges([{ type: 'modified', filePath }]), undefined);
    assert.equal(await readFile(callsPath, 'utf8'), 'apple\n');

    await writeFile(filePath, 'banana\n');
    await session.handleFileChanges([{ type: 'modified', filePath }]);

    assert.deepEqual(Object.keys(session.getIssues().issues.exports['fruits.ts']), ['apple']);
    assert.equal(await readFile(callsPath, 'utf8'), 'apple\nbanana\n');

    assert.equal(await session.handleFileChanges([{ type: 'modified', filePath }]), undefined);
    assert.equal(await readFile(callsPath, 'utf8'), 'apple\nbanana\n');

    await writeFile(filePath, 'invalid\n');
    await assert.rejects(session.handleFileChanges([{ type: 'modified', filePath }]), /Compiler for \.foo failed/);
    assert.deepEqual(Object.keys(session.getIssues().issues.files), ['unused.ts']);

    await writeFile(filePath, 'apple\n');
    await session.handleFileChanges([{ type: 'modified', filePath }]);

    assert.deepEqual(Object.keys(session.getIssues().issues.exports['fruits.ts']), ['banana']);
    assert.equal(await readFile(callsPath, 'utf8'), 'apple\nbanana\ninvalid\napple\n');
    assert.deepEqual(Object.keys(session.getIssues().issues.files), ['unused.ts']);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
