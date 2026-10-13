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
    const options = await createOptions({ cwd, isStrict, isProduction });
    const { issues, counters } = await main(options);

    assert(!('src/routes/(base)/(home)/index.tsx' in issues.files));
    assert(!('src/routes/(base)/[...404]/index.tsx' in issues.files));
    assert(!('src/routes/(seo)/robots.txt/index.ts' in issues.files));
    assert(!('src/routes/(base)/(home)/index.tsx' in issues.exports));
    assert(!('src/routes/(base)/[...404]/index.tsx' in issues.exports));
    assert(!('src/routes/(seo)/robots.txt/index.ts' in issues.exports));
    assert('src/orphan.ts' in issues.files);
    assert(!('src/routes/__tests__/page.test.ts' in issues.files));
    assert(!('src/test-helper.ts' in issues.files));
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

for (const isStrict of [false, true]) {
  test(`Read filesystem-routing directories and extensions (strict: ${isStrict})`, async () => {
    const cwd = resolve('fixtures/plugins/filesystem-routing-custom/{app}(test)[workspace]');
    const options = await createOptions({ cwd, isStrict });
    const { issues, counters } = await main(options);

    assert(!('src/pages/users/[id].tsx' in issues.files));
    assert(!('src/api/status.ts' in issues.files));
    assert(!('src/namespaced/home.ts' in issues.files));
    assert(!('src/pages/users/components/UserLabel.tsx' in issues.files));
    assert('src/pages/excluded.ts' in issues.files);
    assert('src/routes/unused.tsx' in issues.files);
    assert(!('src/(pages)/home.tsx' in issues.files));
    assert(!('src/[locale]/about.ts' in issues.files));
    assert(!('home.jsx' in issues.files));
    for (const dir of ['spread', 'mixed', 'dynamic']) assert(!(`src/${dir}/home.tsx` in issues.files));
    assert(!('src/mixed/about.mdx' in issues.files));
    assert(!('src/dynamic/about.mdx' in issues.files));
    assert('src/empty/home.tsx' in issues.files);
    assert.deepEqual(counters, {
      ...baseCounters,
      files: 3,
      processed: isStrict ? 15 : 16,
      total: isStrict ? 15 : 16,
    });
  });

  test(`Override filesystem-routing entries to exclude colocated helpers (strict: ${isStrict})`, async () => {
    const cwd = resolve('fixtures/plugins/filesystem-routing-override');
    const options = await createOptions({ cwd, isStrict });
    const { issues, counters } = await main(options);

    assert(!('src/pages/home.tsx' in issues.files));
    assert('src/pages/components/UserLabel.tsx' in issues.files);
    assert.deepEqual(counters, { ...baseCounters, files: 1, processed: isStrict ? 2 : 3, total: isStrict ? 2 : 3 });
  });

  test(`Resolve route directories from the Vite root (strict: ${isStrict})`, async () => {
    const cwd = resolve('fixtures/plugins/filesystem-routing-root');
    const options = await createOptions({ cwd, isStrict });
    const { issues, counters } = await main(options);

    assert(!('src/pages/home.ts' in issues.files));
    assert('pages/unused.ts' in issues.files);
    assert('src/routes/unused.ts' in issues.files);
    assert.deepEqual(counters, { ...baseCounters, files: 2, processed: isStrict ? 3 : 4, total: isStrict ? 3 : 4 });
  });

  test(`Use the workspace root for nested Vite configs (strict: ${isStrict})`, async () => {
    const cwd = resolve('fixtures/plugins/filesystem-routing-config-dir');
    const options = await createOptions({ cwd, isStrict });
    const { issues, counters } = await main(options);

    assert(!('src/routes/home.ts' in issues.files));
    assert('config/src/routes/unused.ts' in issues.files);
    assert.deepEqual(counters, { ...baseCounters, files: 1, processed: isStrict ? 2 : 3, total: isStrict ? 2 : 3 });
  });
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
