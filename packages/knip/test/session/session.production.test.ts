import assert from 'node:assert/strict';
import { rm, writeFile } from 'node:fs/promises';
import test from 'node:test';
import { createSession } from '../../src/session/session.ts';
import { join } from '../../src/util/path.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { createOptions } from '../helpers/create-options.ts';

test('Keep development files out of unused files after a production session update', async () => {
  const cwd = await copyFixture('fixtures/plugins/jest-module-name-mapper');
  const filePath = join(cwd, 'src/main.ts');

  try {
    const options = await createOptions({ cwd, isProduction: true, isSession: true });
    const session = await createSession(options);
    assert.deepEqual(Object.keys(session.getIssues().issues.files), []);
    assert.deepEqual(Object.keys(session.getIssues().issues.exports), []);

    await writeFile(filePath, "console.log('hello');\n");
    await session.handleFileChanges([{ type: 'modified', filePath }]);
    assert.deepEqual(Object.keys(session.getIssues().issues.files), ['src/lib/name.ts']);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
