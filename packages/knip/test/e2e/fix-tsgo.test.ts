import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, realpath, rename, symlink, writeFile } from 'node:fs/promises';
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
  'barrel-namespace-chain',
  'entry-js',
  'typeof-class-in-type-alias',
  'fix',
  'fix-members',
  'ns-spread-reexport',
  'package-entry-bare',
  're-exports-destructure-spread',
  're-exports-recursive',
  're-exports-spread',
  'tsc-files-mode',
  'type-in-type',
  'type-in-value-export',
  'type-in-type-alias',
  'type-visibility',
  'typeof-in-type-alias',
  'zero-config',
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

const libFixtures = ['e2e-lib-public-surface', 'e2e-lib-namespace-subpaths'];

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

    const buildAfter = tsgo(pkgDir);
    assert.equal(buildAfter.status, 0, `post-fix build failed:\n${buildAfter.stdout}${buildAfter.stderr}`);

    const consumerAfter = tsgo(tmp);
    assert.equal(consumerAfter.status, 0, `post-fix consumer failed:\n${consumerAfter.stdout}${consumerAfter.stderr}`);
  });
}
