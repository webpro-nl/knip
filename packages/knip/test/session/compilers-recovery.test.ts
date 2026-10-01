import assert from 'node:assert/strict';
import { rm, writeFile } from 'node:fs/promises';
import test from 'node:test';
import { createSession } from '../../src/session/session.ts';
import { join } from '../../src/util/path.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { createOptions } from '../helpers/create-options.ts';

test('Retain added, deleted, and modified files when a compiler interrupts a session update', async () => {
  const cwd = await copyFixture('fixtures/session-compilers-overlap');
  const filePath = join(cwd, 'selection.foo');
  const addedPath = join(cwd, 'added.ts');
  const deletedPath = join(cwd, 'deleted.ts');
  const modifiedPath = join(cwd, 'apple.ts');

  try {
    await writeFile(deletedPath, 'export const deleted = true;\n');
    const options = await createOptions({ cwd, isSession: true });
    options.parsedConfig.compilers = {
      foo: async (text: string) => {
        const name = text.trim();
        if (name === 'invalid') throw new Error('Invalid fruit');
        return `import { fruit } from './${name}.ts'; console.log(fruit);`;
      },
    };
    const session = await createSession(options);
    assert.deepEqual(Object.keys(session.getIssues().issues.files).sort(), ['banana.ts', 'cherry.ts', 'deleted.ts']);

    await writeFile(filePath, 'invalid\n');
    await writeFile(addedPath, 'export const added = true;\n');
    await rm(deletedPath);
    await assert.rejects(
      session.handleFileChanges([
        { type: 'modified', filePath },
        { type: 'added', filePath: addedPath },
        { type: 'deleted', filePath: deletedPath },
      ]),
      /Compiler for \.foo failed/
    );
    assert.equal(await session.handleFileChanges([{ type: 'modified', filePath: join(cwd, '.git/index') }]), undefined);

    await writeFile(filePath, 'apple\n');
    await session.handleFileChanges([{ type: 'modified', filePath }]);
    assert.deepEqual(Object.keys(session.getIssues().issues.files).sort(), ['added.ts', 'banana.ts', 'cherry.ts']);

    await writeFile(filePath, 'invalid\n');
    await writeFile(modifiedPath, "export const fruit = 'apple';\nexport const unused = true;\n");
    await assert.rejects(
      session.handleFileChanges([
        { type: 'modified', filePath },
        { type: 'modified', filePath: modifiedPath },
      ]),
      /Compiler for \.foo failed/
    );

    await writeFile(filePath, 'apple\n');
    await session.handleFileChanges([{ type: 'modified', filePath }]);
    assert.deepEqual(Object.keys(session.getIssues().issues.exports['apple.ts']), ['unused']);
    assert.deepEqual(Object.keys(session.getIssues().issues.files).sort(), ['added.ts', 'banana.ts', 'cherry.ts']);

    await writeFile(filePath, 'invalid\n');
    await rm(addedPath);
    await writeFile(deletedPath, 'export const temporary = true;\n');
    await assert.rejects(
      session.handleFileChanges([
        { type: 'modified', filePath },
        { type: 'deleted', filePath: addedPath },
        { type: 'added', filePath: deletedPath },
      ]),
      /Compiler for \.foo failed/
    );

    await writeFile(filePath, 'apple\n');
    await writeFile(addedPath, 'export const recreated = true;\n');
    await rm(deletedPath);
    await session.handleFileChanges([
      { type: 'modified', filePath },
      { type: 'added', filePath: addedPath },
      { type: 'deleted', filePath: deletedPath },
    ]);
    assert.deepEqual(Object.keys(session.getIssues().issues.files).sort(), ['added.ts', 'banana.ts', 'cherry.ts']);
    assert.equal(await session.handleFileChanges([{ type: 'modified', filePath }]), undefined);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
