import assert from 'node:assert/strict';
import test from 'node:test';
import { pluginNames } from '../../src/types/PluginNames.ts';
import { getKnownErrors, isKnownError } from '../../src/util/errors.ts';
import { parseConfiguration } from '../../src/util/parse-configuration.ts';

test('Validate root and workspace configuration without copying or mutating the input', () => {
  const compiler = (source: string) => source;
  const ignore = /^@generated\//;
  const input = {
    entry: ['src/start.ts'],
    paths: { '@app/*': ['src/*'] },
    ignoreDependencies: ['optional-package', ignore],
    ignoreExportsUsedInFile: { type: true, interface: false },
    ignoreIssues: { 'src/generated/**': ['exports', 'types'] },
    cycles: { allow: [['src/a.ts', 'src/b.ts']], dynamicImports: true },
    compilers: { mdx: true, custom: compiler },
    rules: { exports: 'warn', files: 'off' },
    include: ['files'],
    exclude: ['types'],
    tags: ['-internal'],
    preprocessor: ['./scripts/report.ts'],
    preprocessorOptions: { nested: { limit: 5 } },
    workspaces: {
      'packages/app': { entry: 'src/start.ts', vite: { config: 'build.config.ts', extra: true } },
    },
  };
  Object.freeze(input.entry);
  Object.freeze(input.workspaces['packages/app'].vite);
  const output = parseConfiguration(Object.freeze(input));
  assert.equal(output, input);
  assert.equal(output.entry, input.entry);
  assert.equal(output.paths?.['@app/*'], input.paths['@app/*']);
  assert.equal(output.workspaces, input.workspaces);
  assert.equal(output.cycles?.allow?.[0], input.cycles.allow[0]);
  assert.equal(output.ignoreDependencies?.[1], ignore);
  assert.equal(output.compilers?.custom, compiler);
  assert.equal(output.preprocessorOptions?.nested, input.preprocessorOptions.nested);
  assert.equal(input.workspaces['packages/app'].vite.extra, true);
});

test('Accept every plugin name in root and workspace configuration', () => {
  const plugins = Object.fromEntries(pluginNames.map(name => [name, true]));
  const input = { ...plugins, workspaces: { app: plugins } };
  assert.deepEqual(parseConfiguration(input), input);
});

test('Validate all plugin shorthand forms and retain unknown plugin options', () => {
  assert.deepEqual(
    parseConfiguration({
      vite: false,
      webpack: 'build.config.js',
      eslint: ['lint.config.js'],
      jest: { config: ['test.config.ts'], entry: 'tests/*.ts', project: ['src/*.ts'], extra: true },
    }),
    {
      vite: false,
      webpack: 'build.config.js',
      eslint: ['lint.config.js'],
      jest: { config: ['test.config.ts'], entry: 'tests/*.ts', project: ['src/*.ts'], extra: true },
    }
  );
});

test('Preserve explicitly undefined options and omit absent options', () => {
  assert.deepEqual(parseConfiguration({}), {});
  assert.deepEqual(parseConfiguration({ entry: undefined, vite: { config: undefined } }), {
    entry: undefined,
    vite: { config: undefined },
  });
});

test('Keep existing permissive custom compiler values', () => {
  const input = { compilers: { custom: false }, asyncCompilers: { custom: null } };
  assert.deepEqual(parseConfiguration(input), input);
});

test('Reject invalid configuration shapes and unknown options', () => {
  for (const input of [
    null,
    [],
    false,
    { entry: 42 },
    { project: ['src/*.ts', null] },
    { project: Array(1) },
    { ignoreDependencies: [42] },
    { paths: { '@app': 'src' } },
    { paths: new Date() },
    { includeEntryExports: 'yes' },
    { rules: { exports: 'warning' } },
    { rules: { exports: undefined } },
    { rules: { unknown: 'off' } },
    { include: ['unknown'] },
    { ignoreIssues: { 'src/*': ['unknown'] } },
    { ignoreExportsUsedInFile: { type: 'yes' } },
    { ignoreExportsUsedInFile: { unknown: true } },
    { cycles: { allow: ['src/a.ts'] } },
    { cycles: { unknown: true } },
    { preprocessorOptions: [] },
    { vite: { entry: null } },
    { workspaces: { app: false } },
    { workspaces: { app: { rules: {} } } },
    { workspaces: { app: { cycles: {} } } },
    { workspaces: { app: { typo: true } } },
    { typo: undefined },
    { constructor: true },
    JSON.parse('{"__proto__": {"polluted": true}}'),
  ]) {
    assert.throws(
      () => parseConfiguration(input),
      error => error instanceof Error && isKnownError(error)
    );
  }
});

test('Report multiple validation errors with nested locations', () => {
  assert.throws(
    () =>
      parseConfiguration({
        ignoreGlobalBinaries: 'yes',
        workspaces: { app: { paths: { '@app': [42] } } },
        typo: true,
      }),
    error => {
      assert(error instanceof Error);
      assert.deepEqual(
        getKnownErrors(error).map(error => error.message),
        [
          'Invalid input (location: ignoreGlobalBinaries, expected: boolean)',
          'Invalid input (location: workspaces.app.paths.@app.0, expected: string)',
          'Invalid input (unrecognized_keys: typo)',
        ]
      );
      return true;
    }
  );
});

test('Report unrecognized keys of an object in a single error', () => {
  assert.throws(
    () => parseConfiguration({ foo: 1, entry: 1, bar: 2, cycles: { baz: 1, dynamicImports: 'yes', qux: 2 } }),
    error => {
      assert(error instanceof Error);
      assert.deepEqual(
        getKnownErrors(error).map(error => error.message),
        [
          'Invalid input (location: entry, expected: array)',
          'Invalid input (location: cycles.dynamicImports, expected: boolean)',
          'Invalid input (location: cycles, unrecognized_keys: baz, qux)',
          'Invalid input (unrecognized_keys: foo, bar)',
        ]
      );
      return true;
    }
  );
});

test('Validate record keys without changing the input or its prototype', () => {
  const input = JSON.parse(
    '{"paths":{"__proto__":["ignored"],"constructor":["src/app.ts"],"toString":["src/text.ts"]}}'
  );
  const output = parseConfiguration(input);
  assert.equal(output.paths, input.paths);
  assert.equal(Object.hasOwn(output.paths!, '__proto__'), true);
  assert.equal(Object.getPrototypeOf(output.paths), Object.prototype);
  const rules = Object.create({ exports: 'warn' });
  assert.equal(parseConfiguration({ rules }).rules, rules);
});

test('Report nested errors in configuration key order', () => {
  assert.throws(
    () =>
      parseConfiguration({
        vite: { entry: null },
        project: ['src/app.ts', 42],
        ignoreExportsUsedInFile: { type: 'yes' },
        ignoreGlobalBinaries: 'yes',
      }),
    error => {
      assert(error instanceof Error);
      assert.deepEqual(
        getKnownErrors(error).map(error => error.message),
        [
          'Invalid input (location: vite.entry, expected: array)',
          'Invalid input (location: project.1, expected: string)',
          'Invalid input (location: ignoreExportsUsedInFile.type, expected: boolean)',
          'Invalid input (location: ignoreGlobalBinaries, expected: boolean)',
        ]
      );
      return true;
    }
  );
});
