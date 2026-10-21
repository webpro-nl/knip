import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import test, { type TestContext } from 'node:test';
import { ProjectPrincipal } from '../../src/ProjectPrincipal.ts';
import MDX from '../../src/compilers/mdx.ts';
import SCSS from '../../src/compilers/scss.ts';
import {
  createPersistentSession,
  createSession,
  type Session,
  type SessionOptionsLoader,
} from '../../src/session/session.ts';
import { SourceFileManager } from '../../src/typescript/SourceFileManager.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';

const setup = async (t: TestContext) => {
  const cwd = await realpath(await mkdtemp(join(tmpdir(), 'knip-session-source-only-')));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await writeFile(
    join(cwd, 'package.json'),
    JSON.stringify({
      name: 'source-only',
      dependencies: { '@mdx-js/mdx': '3.0.0', sass: '1.0.0', tailwindcss: '4.0.0' },
      knip: { entry: ['index.ts'], project: ['*.ts', '*.mdx', '*.scss', '*.css', '*.foo'] },
    })
  );
  await writeFile(join(cwd, 'index.ts'), "import './guide.mdx'; import './styles.scss'; import './styles.css';\n");
  await writeFile(join(cwd, 'guide.mdx'), "import { apple } from './fruits.ts';\n\n# Fruit\n");
  await writeFile(join(cwd, 'styles.scss'), 'body { color: red; }\n');
  await writeFile(join(cwd, 'styles.css'), 'body { color: blue; }\n');
  await writeFile(join(cwd, 'fruits.ts'), 'export const apple = 1;\nexport const banana = 2;\n');
  return cwd;
};

const assertFresh = async (session: Session, loadOptions: SessionOptionsLoader, files: string[]) => {
  const fresh = await createSession({ ...(await loadOptions()), isCache: false });
  assert.equal(JSON.stringify(session.getIssues()), JSON.stringify(fresh.getIssues()));
  assert.deepEqual(session.getIssues(), fresh.getIssues());
  assert.deepEqual(session.getResults(), fresh.getResults());
  assert.deepEqual(session.describePackageJson(), fresh.describePackageJson());
  for (const filePath of files) {
    assert.deepEqual(
      { ...session.describeFile(filePath), metrics: undefined },
      { ...fresh.describeFile(filePath), metrics: undefined }
    );
  }
};

test('compiler eligibility checks the original functions in every workspace scope', async t => {
  const cwd = await setup(t);
  const options = await createOptions({ cwd, isSession: true });
  for (const cacheKey of [undefined, 'v1', () => 'v1']) {
    const principal = new ProjectPrincipal(
      options,
      filePath => filePath,
      undefined,
      () => '.'
    );
    assert.equal(principal.hasOnlySourceCompilers(), true);
    principal.addCompilers(
      '.',
      new Map([
        ['.mdx', MDX.compiler],
        ['.scss', SCSS.compiler],
      ])
    );
    principal.addCompilers('docs', new Map([['.mdx', MDX.compiler]]));
    assert.equal(principal.hasOnlySourceCompilers(), true);
    principal.addCompilers('custom', new Map([['.mdx', Object.assign((source: string) => source, { cacheKey })]]));
    assert.equal(principal.hasOnlySourceCompilers(), false);
  }
});

for (const isCache of [false, true]) {
  test(`source-only compilers retain the graph for body edits and rebuild changed topology (cache=${isCache})`, async t => {
    const cwd = await setup(t);
    const loadOptions = () => createOptions({ cwd, isSession: true, args: { cache: isCache } });
    let loads = 0;
    const session = await createPersistentSession(() => {
      loads++;
      return loadOptions();
    });
    const files = ['index.ts', 'guide.mdx', 'styles.scss', 'styles.css', 'fruits.ts'];
    for (const filePath of files) assert.ok(session.describeFile(filePath));
    assert.deepEqual(Object.keys(session.getIssues().issues.exports['fruits.ts']), ['banana']);
    const read = t.mock.method(SourceFileManager.prototype, 'readRawFile');

    await writeFile(join(cwd, 'fruits.ts'), 'export const apple = 123;\n\nexport const banana = 2;\n');
    await session.handleFileChanges([{ type: 'modified', filePath: 'fruits.ts' }]);
    assert.equal(loads, 1, 'body edits must reuse the existing session');
    for (const call of read.mock.calls) {
      for (const filePath of ['guide.mdx', 'styles.scss', 'styles.css']) {
        assert.notEqual(call.arguments[0], join(cwd, filePath), 'unrelated built-ins must not recompile');
      }
    }
    await assertFresh(session, loadOptions, files);

    await writeFile(join(cwd, 'guide.mdx'), "import { apple } from './fruits.ts';\n\n# Updated fruit guide\n");
    await session.handleFileChanges([{ type: 'modified', filePath: 'guide.mdx' }]);
    assert.equal(loads, 1, 'source-only compiler body edits must retain unchanged topology');
    await assertFresh(session, loadOptions, files);

    await writeFile(join(cwd, 'guide.mdx'), "import { banana } from './fruits.ts';\n\n# Fruit\n");
    await session.handleFileChanges([{ type: 'modified', filePath: 'guide.mdx' }]);
    assert.deepEqual(Object.keys(session.getIssues().issues.exports['fruits.ts']), ['apple']);
    assert.equal(loads, 2, 'changed compiler imports must rebuild the graph');
    await assertFresh(session, loadOptions, files);

    await writeFile(join(cwd, 'index.ts'), "import './styles.scss'; import './styles.css';\n");
    await session.handleFileChanges([{ type: 'modified', filePath: 'index.ts' }]);
    assert.equal(loads, 3, 'removed imports must rebuild reachability');
    assert.deepEqual(Object.keys(session.getIssues().issues.files).sort(), ['fruits.ts', 'guide.mdx']);
    await assertFresh(session, loadOptions, files);
  });
}

for (const cacheKey of [undefined, 'v1', () => 'v1']) {
  test(`custom compilers rebuild tracked and arbitrary side inputs (cache key=${typeof cacheKey})`, async t => {
    const cwd = await setup(t);
    await writeFile(
      join(cwd, 'index.ts'),
      "import './guide.mdx'; import './selection.foo'; import { selected } from './selected.ts'; console.log(selected);\n"
    );
    await writeFile(join(cwd, 'guide.mdx'), '# Fruit\n');
    await writeFile(join(cwd, 'selection.foo'), 'fruit');
    await writeFile(join(cwd, 'selected.ts'), "export const selected = 'apple';\n");
    await writeFile(join(cwd, 'extra.txt'), 'cherry');
    await writeFile(
      join(cwd, 'fruits.ts'),
      'export const apple = 1;\nexport const banana = 2;\nexport const cherry = 3;\n'
    );
    const compiled: string[] = [];
    const compiler = Object.assign(
      () => {
        const source = readFileSync(join(cwd, 'selected.ts'), 'utf8');
        const selected = source.match(/selected = '(\w+)'/)?.[1];
        assert.ok(selected);
        const extra = readFileSync(join(cwd, 'extra.txt'), 'utf8');
        compiled.push(`${selected},${extra}`);
        return `import { ${selected}, ${extra} } from './fruits.ts'; console.log(${selected}, ${extra});`;
      },
      { cacheKey }
    );
    const loadOptions = async () => {
      const options = await createOptions({ cwd, isSession: true, args: { cache: true } });
      options.parsedConfig.compilers = { foo: compiler };
      return options;
    };
    let loads = 0;
    const session = await createPersistentSession(() => {
      loads++;
      return loadOptions();
    });
    assert.deepEqual(compiled, ['apple,cherry']);
    assert.deepEqual(Object.keys(session.getIssues().issues.exports['fruits.ts']), ['banana']);

    await writeFile(join(cwd, 'selected.ts'), "export const selected = 'banana';\n");
    await session.handleFileChanges([{ type: 'modified', filePath: 'selected.ts' }]);
    assert.deepEqual(Object.keys(session.getIssues().issues.exports['fruits.ts']), ['apple']);
    assert.equal(loads, 2, 'a custom compiler may depend on the modified TypeScript source');
    assert.deepEqual(compiled, ['apple,cherry', 'banana,cherry']);
    const files = ['index.ts', 'guide.mdx', 'selection.foo', 'selected.ts', 'fruits.ts'];
    await assertFresh(session, loadOptions, files);

    compiled.length = 0;
    await writeFile(join(cwd, 'extra.txt'), 'apple');
    await session.handleFileChanges([{ type: 'modified', filePath: 'extra.txt' }]);
    assert.equal(loads, 3, 'inputs outside project patterns must rebuild custom compilers');
    assert.deepEqual(compiled, ['banana,apple']);
    assert.deepEqual(Object.keys(session.getIssues().issues.exports['fruits.ts']), ['cherry']);
    await assertFresh(session, loadOptions, files);
  });
}
