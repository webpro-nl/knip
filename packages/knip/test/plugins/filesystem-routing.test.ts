import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import filesystemRouting from '../../src/plugins/filesystem-routing/index.ts';
import type { PluginOptions } from '../../src/types/config.ts';
import { _parseFile } from '../../src/typescript/ast-nodes.ts';
import { toProductionEntry } from '../../src/util/input.ts';
import { join } from '../../src/util/path.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

for (const mode of ['default', 'production', 'strict']) {
  test(`Discover filesystem-routing pages and HTTP handlers (${mode})`, async () => {
    const cwd = resolve('fixtures/plugins/filesystem-routing');
    const isStrict = mode === 'strict';
    const isProduction = mode !== 'default';
    const { issues, counters } = await main(await createOptions({ cwd, isStrict, isProduction }));

    assert.deepEqual(Object.keys(issues.files), ['src/orphan.ts']);
    if (isStrict) assert(issues.unlisted['src/routes/__tests__/page.test.ts']['@testing-library/dom']);
    assert.deepEqual(counters, {
      ...baseCounters,
      files: 1,
      unlisted: isStrict ? 1 : 0,
      processed: isProduction ? 8 : 9,
      total: isProduction ? 8 : 9,
    });
  });
}

const cases = [
  {
    fixture: 'custom/{app}(test)[workspace]',
    unused: ['src/pages/excluded.ts', 'src/routes/unused.tsx', 'src/empty/home.tsx'],
    total: 16,
  },
  {
    fixture: 'override',
    unused: ['src/pages/components/UserLabel.tsx'],
    total: 3,
  },
  {
    fixture: 'root',
    unused: ['pages/unused.ts', 'src/routes/unused.ts'],
    total: 4,
  },
  {
    fixture: 'config-dir',
    unused: ['config/src/routes/unused.ts'],
    total: 3,
  },
];

for (const { fixture, unused, total } of cases) {
  for (const isStrict of [false, true]) {
    test(`Read filesystem-routing configuration (${fixture}, strict: ${isStrict})`, async () => {
      const cwd = resolve(`fixtures/plugins/filesystem-routing-${fixture}`);
      const { issues, counters } = await main(await createOptions({ cwd, isStrict }));
      const count = total - Number(isStrict);

      assert.deepEqual(Object.keys(issues.files).sort(), unused.toSorted());
      assert.deepEqual(counters, { ...baseCounters, files: unused.length, processed: count, total: count });
    });
  }
}

const cwd = resolve('fixtures/plugins/filesystem-routing');
const pluginOptions: PluginOptions = {
  cwd,
  rootCwd: cwd,
  manifest: {},
  rootManifest: undefined,
  getManifest: () => undefined,
  config: { config: null, entry: null, project: null },
  configFileDir: cwd,
  configFileName: 'vite.config.ts',
  configFilePath: join(cwd, 'vite.config.ts'),
  isResolvedConfigFile: false,
  isProduction: false,
  enabledPlugins: [],
  getInputsFromScripts: () => [],
};

const getInputs = (source: string, cwd = pluginOptions.cwd) => {
  assert(filesystemRouting.resolveFromAST);
  const { program } = _parseFile('vite.config.ts', source);
  return filesystemRouting.resolveFromAST(program, { ...pluginOptions, cwd, readFile: () => '' });
};

test('Use filesystem-routing defaults for omitted or unevaluated options', () => {
  for (const root of [cwd, join(cwd, '{app}(test)[workspace]')]) {
    for (const source of [
      "import { fileRoutes } from 'filesystem-routing/vite'; fileRoutes();",
      "import { fileRoutes } from 'filesystem-routing/vite'; fileRoutes({});",
      "import { fileRoutes } from 'filesystem-routing/vite'; fileRoutes(options);",
      "const { fileRoutes } = await import('filesystem-routing/vite'); fileRoutes();",
    ]) {
      assert.deepEqual(getInputs(source, root), [
        toProductionEntry(join(root, 'src/routes/**/*.{js,jsx,ts,tsx,tsrx}')),
      ]);
    }
  }
});

test('Resolve empty, relative and absolute route directories', () => {
  for (const root of [cwd, join(cwd, '{app}(test)[workspace]')]) {
    for (const dir of ['', '.', root]) {
      const source = `
      import { fileRoutes } from 'filesystem-routing/vite';
      fileRoutes({ dir: ${JSON.stringify(dir)}, extensions: ['ts'] });
    `;
      assert.deepEqual(getInputs(source, root), [toProductionEntry(join(root, '**/*.ts'))]);
    }
  }
});

test('Read the Vite root through type assertions', () => {
  for (const suffix of ['satisfies UserConfig', 'as UserConfig', 'as const satisfies UserConfig']) {
    const source = `
      import { fileRoutes } from 'filesystem-routing/vite';
      export default { root: 'app', plugins: [fileRoutes({ dir: 'pages', extensions: ['ts'] })] } ${suffix};
    `;
    assert.deepEqual(getInputs(source), [toProductionEntry(join(cwd, 'app/pages/**/*.ts'))]);
  }
});
