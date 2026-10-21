import assert from 'node:assert/strict';
import { mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { createPersistentSession, createSession } from '../../src/session/session.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';

test('persistent updates preserve compiler barriers, recover after failure and serialize overlapping edits', async t => {
  const cwd = await realpath(await mkdtemp(join(tmpdir(), 'knip-session-compiler-barrier-')));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await writeFile(
    join(cwd, 'package.json'),
    '{"name":"compiler-barrier","knip":{"entry":["selection.foo"],"project":["*.ts","*.foo"]}}'
  );
  await writeFile(join(cwd, 'selection.foo'), 'apple');
  await writeFile(join(cwd, 'generated.ts'), 'export const initial = 0;\n');
  let release = () => {};
  let entered = () => {};
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  const compiling = new Promise<void>(resolve => {
    entered = resolve;
  });
  t.after(() => release());
  const compiled: string[] = [];
  const loadOptions = async () => {
    const options = await createOptions({ cwd, isSession: true });
    options.parsedConfig.compilers = {
      foo: async text => {
        compiled.push(text);
        if (text === 'invalid') throw new Error('Invalid selection');
        if (text === 'banana') {
          entered();
          await gate;
        }
        await writeFile(join(cwd, 'generated.ts'), `export const ${text} = 1;\nexport const unused = 2;\n`);
        return `import { ${text} } from './generated.ts'; console.log(${text});`;
      },
    };
    return options;
  };
  const session = await createPersistentSession(loadOptions);
  assert.deepEqual(Object.keys(session.getIssues().issues.exports['generated.ts']), ['unused']);

  await writeFile(join(cwd, 'selection.foo'), 'banana');
  const first = session.handleFileChanges([{ type: 'modified', filePath: 'selection.foo' }]);
  await compiling;
  await writeFile(join(cwd, 'selection.foo'), 'cherry');
  const second = session.handleFileChanges([{ type: 'modified', filePath: 'selection.foo' }]);
  release();
  await Promise.all([first, second]);
  assert.deepEqual(compiled, ['apple', 'banana', 'cherry']);
  let fresh = await createSession(await loadOptions());
  assert.equal(JSON.stringify(session.getIssues()), JSON.stringify(fresh.getIssues()));
  assert.deepEqual(
    { ...session.describeFile('generated.ts'), metrics: undefined },
    { ...fresh.describeFile('generated.ts'), metrics: undefined }
  );

  await writeFile(join(cwd, 'selection.foo'), 'invalid');
  await writeFile(join(cwd, 'added.ts'), 'export {};\n');
  await assert.rejects(
    session.handleFileChanges([
      { type: 'modified', filePath: 'selection.foo' },
      { type: 'added', filePath: 'added.ts' },
    ]),
    /Compiler for \.foo failed/
  );
  assert.equal(await session.handleFileChanges([{ type: 'modified', filePath: '.git/index' }]), undefined);

  await writeFile(join(cwd, 'selection.foo'), 'apple');
  await session.handleFileChanges([{ type: 'modified', filePath: 'selection.foo' }]);
  fresh = await createSession(await loadOptions());
  assert.equal(JSON.stringify(session.getIssues()), JSON.stringify(fresh.getIssues()));
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['added.ts']);

  await writeFile(join(cwd, 'generated.ts'), 'export const stale = 1;\n');
  await session.handleFileChanges([{ type: 'modified', filePath: 'generated.ts' }]);
  fresh = await createSession(await loadOptions());
  assert.equal(JSON.stringify(session.getIssues()), JSON.stringify(fresh.getIssues()));
  assert.deepEqual(
    { ...session.describeFile('generated.ts'), metrics: undefined },
    { ...fresh.describeFile('generated.ts'), metrics: undefined }
  );
});
