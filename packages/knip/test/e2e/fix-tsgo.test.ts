import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, realpath, rename, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { join } from '../../src/util/path.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';
import { tsgo } from '../helpers/tsgo.ts';

const tsconfig = JSON.stringify({
  compilerOptions: {
    target: 'ES2022',
    module: 'esnext',
    moduleResolution: 'bundler',
    noEmit: true,
    allowImportingTsExtensions: true,
  },
  include: ['**/*.ts'],
});

const fixtures = [
  'namespaces/barrel-namespace-chain',
  'entry/js',
  'types/typeof-class-in-type-alias',
  'fix',
  'fix-members',
  'namespaces/ns-spread-reexport',
  'entry/package-entry-bare',
  're-exports/aliased-ns',
  're-exports/destructure-spread',
  're-exports/recursive',
  're-exports/spread',
  'resolution/tsc-files-mode',
  'types/type-in-type',
  'types/type-in-value-export',
  'types/type-in-type-alias',
  'types/type-visibility',
  'types/typeof-in-type-alias',
  'infra/zero-config',
];

for (const name of fixtures) {
  test(`tsgo clean before and after knip --fix: ${name}`, async () => {
    const cwd = await copyFixture(`fixtures/${name}`);
    await writeFile(join(cwd, 'tsconfig.json'), tsconfig);

    const baseline = tsgo(cwd);
    assert.equal(baseline.status, 0, `baseline tsgo failed:\n${baseline.stdout}${baseline.stderr}`);

    const fix = exec('knip --fix --no-progress', { cwd });
    assert.match(fix.stdout, /\(removed\)/, `knip --fix removed nothing:\n${fix.stdout}\n${fix.stderr}`);

    const after = tsgo(cwd);
    assert.equal(after.status, 0, `post-fix tsgo failed:\n${after.stdout}${after.stderr}`);
  });
}

// FP-direction lib fixtures (knip must NOT strip names tsc/tsgo still needs).
// The post-fix tsgo emit on pkg/ catches violations as a declaration-emit
// error. The exact code depends on shape (TS4023 cross-module is the most
// common; TS4081/4082 fire on same-module private names; TS4060/4063 on
// return/param positions). Test asserts on tsgo exit status, not error code:
//   typed-exports             — explicit return-type annotations on exported values
//   export-star-as            — `export * as Ns from '…'` namespace re-export
//   arrow-inferred-return     — arrow with block body, no return type
//   call-forward-decl         — Identifier callee resolving to forward-declared local
//   member-call               — `obj.method()` member-expression callee
//   call-arg                  — Identifier as call argument at top level (`wrap(inner)`)
//
// FN-direction lib fixtures (knip must FLAG names tsc/tsgo doesn't strictly
// need; post-fix file content must NOT contain the names in libFixtureRemovals):
//   as-cast-in-body           — `as T` / `<T>x` / `satisfies T` inside a function body
//   call-arg-in-body          — Identifier as call argument inside a function body
const libFixtures = [
  'e2e-lib-typed-exports',
  'e2e-lib-export-star-as',
  'e2e-lib-arrow-inferred-return',
  'e2e-lib-call-forward-decl',
  'e2e-lib-member-call',
  'e2e-lib-call-arg',
  'e2e-lib-as-cast-in-body',
  'e2e-lib-call-arg-in-body',
];

const libFixtureRemovals: Record<string, RegExp[]> = {
  'e2e-lib-arrow-inferred-return': [/export interface UnusedHandlerOptions/],
  'e2e-lib-call-forward-decl': [/export interface UnusedHelperOptions/],
  'e2e-lib-member-call': [/export interface UnusedHelperOptions/],
  'e2e-lib-call-arg': [/export interface UnusedHelperOptions/],
  'e2e-lib-as-cast-in-body': [/export interface InternalCast/, /export interface UnusedHelperOptions/],
  'e2e-lib-call-arg-in-body': [
    /export interface InternalActionA/,
    /export interface InternalActionB/,
    /export interface UnusedHelperOptions/,
  ],
};

for (const name of libFixtures) {
  const pkgName = `@fixtures/${name}`;
  test(`consume built dist after knip --fix: ${name}`, async () => {
    const tmp = await realpath(await mkdtemp(join(tmpdir(), 'knip-e2e-pkg-')));
    const pkgDir = join(tmp, 'pkg');
    await mkdir(pkgDir, { recursive: true });
    await cp(resolve(`fixtures/${name}`), pkgDir, { recursive: true });
    await rename(join(pkgDir, '_index.ts'), join(tmp, '_index.ts'));
    await mkdir(join(tmp, 'node_modules', pkgName.split('/')[0]), { recursive: true });
    await symlink(pkgDir, join(tmp, 'node_modules', pkgName), 'dir');

    await writeFile(join(tmp, 'package.json'), '{ "name": "e2e-lib-consumer", "type": "module" }\n');
    await writeFile(join(tmp, 'tsconfig.json'), tsconfig);

    const buildBaseline = tsgo(pkgDir);
    assert.equal(buildBaseline.status, 0, `baseline build failed:\n${buildBaseline.stdout}${buildBaseline.stderr}`);

    const consumerBaseline = tsgo(tmp);
    assert.equal(
      consumerBaseline.status,
      0,
      `baseline consumer failed:\n${consumerBaseline.stdout}${consumerBaseline.stderr}`
    );

    const fix = exec('knip --fix --no-progress', { cwd: pkgDir });
    assert.match(fix.stdout, /\(removed\)/, `knip --fix removed nothing:\n${fix.stdout}\n${fix.stderr}`);

    const removals = libFixtureRemovals[name];
    if (removals) {
      const contents = await readFile(join(pkgDir, 'src/handler.ts'), 'utf8');
      for (const pattern of removals) {
        assert.doesNotMatch(contents, pattern, `${name}: expected to remove ${pattern}`);
      }
    }

    const buildAfter = tsgo(pkgDir);
    assert.equal(buildAfter.status, 0, `post-fix build failed:\n${buildAfter.stdout}${buildAfter.stderr}`);

    const consumerAfter = tsgo(tmp);
    assert.equal(consumerAfter.status, 0, `post-fix consumer failed:\n${consumerAfter.stdout}${consumerAfter.stderr}`);
  });
}
