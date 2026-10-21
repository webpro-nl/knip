import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path/posix';
import test from 'node:test';
import { collectArtifacts } from './collect-native-artifacts.js';
import {
  binaryName,
  artifactFiles,
  manifestName,
  packageDirectory,
  releaseTargets,
  sha256,
  sourceSnapshot,
  validateArtifacts,
  wasiTarget,
} from './native-artifacts.js';

const source = { sha256: 'source-a', toolchain: '1.99.1' };
const revision = 'a'.repeat(40);

function fixture(t, targets = releaseTargets.slice(0, 1)) {
  const directory = mkdtempSync(join(tmpdir(), 'knip-artifact-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  for (const target of targets) {
    const files = {};
    for (const name of artifactFiles(target)) {
      const bytes = Buffer.from(`unit-test payload: ${target}/${name}`);
      writeFileSync(join(directory, name), bytes);
      files[name] = sha256(bytes);
    }
    writeFileSync(
      join(directory, manifestName(target)),
      JSON.stringify({
        schema: 2,
        target,
        revision,
        clean: true,
        sourceSha256: source.sha256,
        toolchain: source.toolchain,
        compiler: 'rustc 1.99.1 (unit-test)',
        files,
      })
    );
  }
  const check = options => validateArtifacts({ directory, source, ...options });
  const change = (target, updates) => {
    const filename = join(directory, manifestName(target));
    writeFileSync(filename, JSON.stringify({ ...JSON.parse(readFileSync(filename, 'utf8')), ...updates }));
  };
  return { directory, check, change };
}

test('local packing permits one fresh target while publication requires every loader target', t => {
  const local = fixture(t);
  assert.equal(local.check().length, 1);
  assert.throws(() => local.check({ strict: true, required: releaseTargets, revision }), /Missing native artifact/);
  const complete = fixture(t, releaseTargets);
  assert.equal(complete.check({ strict: true, required: releaseTargets, revision }).length, 20);
  assert.ok(releaseTargets.includes('i686-pc-windows-msvc'));
});

test('publication requires WASI and validates every runtime file as one build', t => {
  const native = fixture(
    t,
    releaseTargets.filter(target => target !== wasiTarget)
  );
  assert.throws(() => native.check({ required: releaseTargets, strict: true, revision }), /Missing native artifact/);
  for (const name of artifactFiles(wasiTarget)) {
    const f = fixture(t, [wasiTarget]);
    assert.deepEqual(f.check(), [wasiTarget]);
    writeFileSync(join(f.directory, name), 'changed WASI unit-test payload');
    assert.throws(() => f.check(), /checksum mismatch/);
    rmSync(join(f.directory, name));
    assert.throws(() => f.check(), /Missing native binary or provenance/);
  }
});

test('rejects stale source, lockfile fingerprints, wrong compiler, and substituted binaries', t => {
  const target = releaseTargets[0];
  const f = fixture(t);
  assert.throws(() => f.check({ source: { ...source, sha256: 'changed-source-or-lockfile' } }), /Stale or foreign/);
  f.change(target, { compiler: 'rustc 1.98.0 (unit-test)' });
  assert.throws(() => f.check(), /Unexpected native compiler/);
  f.change(target, { compiler: 'rustc 1.99.1 (unit-test)' });
  writeFileSync(join(f.directory, binaryName(target)), 'substituted unit-test payload');
  assert.throws(() => f.check(), /checksum mismatch/);
});

test('strict collection rejects dirty builds, foreign revisions, and mixtures of individually valid targets', t => {
  const [first, second] = releaseTargets;
  const f = fixture(t, [first, second]);
  f.change(first, { clean: false });
  assert.equal(f.check().length, 2);
  assert.throws(() => f.check({ strict: true }), /uncommitted inputs/);
  f.change(first, { clean: true });
  f.change(second, { revision: 'b'.repeat(40) });
  assert.throws(() => f.check({ strict: true }), /Mixed native source revisions/);
  assert.throws(() => f.check({ strict: true, revision }), /revision mismatch/);
});

test('collects the resolved build revision when workflow_dispatch runs from a different ref', t => {
  const artifacts = fixture(t, releaseTargets);
  const destination = mkdtempSync(join(tmpdir(), 'knip-collected-test-'));
  t.after(() => rmSync(destination, { recursive: true, force: true }));
  let conclusion = 'success';
  let downloads = 0;
  const execute = (command, args) => {
    assert.equal(command, 'gh');
    if (args[1] === 'view') {
      return { status: 0, stdout: JSON.stringify({ status: 'completed', conclusion, headSha: 'b'.repeat(40) }) };
    }
    assert.deepEqual(args.slice(0, 6), ['run', 'download', '123', '--name', `knip-native-${revision}`, '--dir']);
    for (const file of readdirSync(artifacts.directory)) {
      copyFileSync(join(artifacts.directory, file), join(args[6], file));
    }
    downloads++;
    return { status: 0 };
  };
  const collect = () => collectArtifacts({ run: '123', revision, destination, source, execute });
  collect();
  assert.equal(validateArtifacts({ directory: destination, source, revision, strict: true }).length, 20);
  artifacts.change(releaseTargets[0], { revision: 'c'.repeat(40) });
  assert.throws(collect, /revision mismatch/);
  assert.equal(validateArtifacts({ directory: destination, source, revision, strict: true }).length, 20);
  conclusion = 'failure';
  assert.throws(collect, /successful workflow run/);
  assert.equal(downloads, 2);
});

test('selected extension targets are checked before packaging and do not require unrelated artifacts', t => {
  const [first, second] = releaseTargets;
  const f = fixture(t);
  assert.deepEqual(f.check({ selected: [first] }), [first]);
  assert.throws(() => f.check({ selected: [first, second] }), /Missing native binary or provenance/);
  assert.throws(() => f.check({ selected: [first, wasiTarget] }), /Missing native binary or provenance/);
  const withWasi = fixture(t, [first, wasiTarget]);
  assert.deepEqual(withWasi.check({ selected: [first, wasiTarget], strict: true, revision }), [first, wasiTarget]);
  f.change(first, { target: second });
  assert.throws(() => f.check({ selected: [first] }), /Invalid native provenance/);
});

test('rejects missing provenance, orphan manifests, and undeclared target files', t => {
  const target = releaseTargets[0];
  const f = fixture(t);
  rmSync(join(f.directory, manifestName(target)));
  assert.throws(() => f.check(), /Missing native binary or provenance/);
  const orphan = fixture(t);
  rmSync(join(orphan.directory, binaryName(target)));
  assert.throws(() => orphan.check(), /Missing native binary or provenance/);
  const foreign = fixture(t);
  writeFileSync(join(foreign.directory, binaryName('unknown-target')), 'unit-test payload');
  assert.throws(() => foreign.check(), /Unexpected native artifact/);
});

test('fingerprint follows actual Rust sources and Cargo.lock, including added source files', t => {
  const root = mkdtempSync(join(tmpdir(), 'knip-native-inputs-'));
  const directory = join(root, 'packages/knip');
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const original = sourceSnapshot();
  for (const name of [...original.files, 'package.json']) {
    const destination = join(directory, name);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(join(packageDirectory, name), destination);
  }
  assert.equal(sourceSnapshot(directory).sha256, original.sha256);
  const lock = join(directory, 'native/Cargo.lock');
  const bytes = readFileSync(lock);
  writeFileSync(lock, Buffer.concat([bytes, Buffer.from('\n')]));
  assert.notEqual(sourceSnapshot(directory).sha256, original.sha256);
  writeFileSync(lock, bytes);
  const dependencies = join(root, 'pnpm-lock.yaml');
  const dependencyBytes = readFileSync(dependencies);
  writeFileSync(dependencies, Buffer.concat([dependencyBytes, Buffer.from('\n')]));
  assert.notEqual(sourceSnapshot(directory).sha256, original.sha256);
  writeFileSync(dependencies, dependencyBytes);
  const added = join(directory, 'native/src/added-test-input.rs');
  writeFileSync(added, 'pub fn added() {}');
  assert.notEqual(sourceSnapshot(directory).sha256, original.sha256);
  rmSync(added);
  assert.equal(sourceSnapshot(directory).sha256, original.sha256);
  const pkgPath = join(directory, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  pkg.version = '99.0.0';
  writeFileSync(pkgPath, JSON.stringify(pkg));
  assert.equal(sourceSnapshot(directory).sha256, original.sha256);
});
