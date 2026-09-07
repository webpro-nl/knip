import assert from 'node:assert/strict';
import { rm, writeFile } from 'node:fs/promises';
import test from 'node:test';
import { createSession } from '../../src/session/session.ts';
import { join } from '../../src/util/path.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { createOptions } from '../helpers/create-options.ts';

test('Preserve the latest compiled source when session updates overlap', async () => {
  const cwd = await copyFixture('fixtures/session-compilers-overlap');
  const filePath = join(cwd, 'selection.foo');
  let release = () => {};
  let entered = () => {};
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  const compiling = new Promise<void>(resolve => {
    entered = resolve;
  });

  try {
    const options = await createOptions({ cwd, isSession: true });
    options.parsedConfig.compilers = {
      foo: async (text: string) => {
        const name = text.trim();
        if (name === 'banana') {
          entered();
          await gate;
        }
        return `import { fruit } from './${name}.ts'; console.log(fruit);`;
      },
    };
    const session = await createSession(options);
    assert.deepEqual(Object.keys(session.getIssues().issues.files).sort(), ['banana.ts', 'cherry.ts']);

    await writeFile(filePath, 'banana\n');
    const firstUpdate = session.handleFileChanges([{ type: 'modified', filePath }]);
    await compiling;
    await writeFile(filePath, 'cherry\n');
    const secondUpdate = session.handleFileChanges([{ type: 'modified', filePath }]);
    setImmediate(release);
    await Promise.all([firstUpdate, secondUpdate]);

    assert.deepEqual(Object.keys(session.getIssues().issues.files).sort(), ['apple.ts', 'banana.ts']);
  } finally {
    release();
    await rm(cwd, { recursive: true, force: true });
  }
});
