import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import posix from 'node:path/posix';
import win32 from 'node:path/win32';
import { fileURLToPath } from 'node:url';
import targets from '../native/targets.cjs';

const path = process.platform === 'win32' ? win32 : posix;
export const packageDirectory = fileURLToPath(new URL('../', import.meta.url));
export const nativeDirectory = path.join(packageDirectory, 'native');
export const releaseTargets = Object.values(targets).flat();
export const wasiTarget = targets['wasi-wasm32'][0];
export const binaryName = target =>
  target === wasiTarget ? 'knip-native.wasm32-wasi.wasm' : `knip-native.${target}.node`;
export const artifactFiles = target =>
  target === wasiTarget
    ? [
        binaryName(target),
        'knip-native.wasi.cjs',
        'knip-native.wasi-runtime.cjs',
        'wasi-worker.mjs',
        'wasi-runtime.LICENSE',
      ]
    : [binaryName(target)];
export const manifestName = target => `knip-native.${target}.json`;
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

function git(directory, args) {
  const result = spawnSync('git', args, { cwd: directory, encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || `git ${args[0]} failed`);
  return result.stdout.trim();
}

export function sourceSnapshot(directory = packageDirectory) {
  const files = [
    '../../pnpm-lock.yaml',
    '../../pnpm-workspace.yaml',
    'native/Cargo.toml',
    'native/Cargo.lock',
    'native/build.rs',
    'native/rust-toolchain.toml',
    'native/index.cjs',
    'native/targets.cjs',
    'scripts/build-native.js',
    'scripts/bundle-wasi.js',
    'scripts/native-artifacts.js',
    'scripts/wasi-runtime.cjs',
    'scripts/wasi-runtime.LICENSE',
  ];
  const visit = relative => {
    for (const entry of readdirSync(path.join(directory, relative), { withFileTypes: true })) {
      const name = `${relative}/${entry.name}`;
      if (entry.isDirectory()) visit(name);
      else if (entry.isFile()) files.push(name);
      else throw new Error(`Native build input must be a regular file: ${name}`);
    }
  };
  visit('native/src');
  files.sort();
  const hash = createHash('sha256');
  for (const file of files) hash.update(`${file}\0${sha256(readFileSync(path.join(directory, file)))}\0`);
  const pkg = JSON.parse(readFileSync(path.join(directory, 'package.json'), 'utf8'));
  for (const name of [
    '@napi-rs/cli',
    'emnapi',
    '@emnapi/core',
    '@emnapi/runtime',
    '@napi-rs/wasm-runtime',
    'rolldown',
  ]) {
    hash.update(
      `${name}\0${pkg.devDependencies[name] ?? pkg.dependencies[name] ?? pkg.optionalDependencies?.[name]}\0`
    );
  }
  hash.update(`napi\0${JSON.stringify(pkg.napi ?? null)}\0`);
  const toolchain = readFileSync(path.join(directory, 'native/rust-toolchain.toml'), 'utf8').match(
    /^channel\s*=\s*"([^"]+)"/m
  )?.[1];
  if (!toolchain) throw new Error('Missing pinned native Rust toolchain');
  return { sha256: hash.digest('hex'), toolchain, files };
}

export function buildIdentity(directory = packageDirectory) {
  const source = sourceSnapshot(directory);
  return {
    source,
    revision: git(directory, ['rev-parse', 'HEAD']),
    clean:
      git(directory, ['status', '--porcelain', '--untracked-files=all', '--', ...source.files, 'package.json']) === '',
  };
}

export function writeArtifact(sourceFile, destination, target, identity, compiler, backend) {
  if (!releaseTargets.includes(target)) throw new Error(`Unsupported native target: ${target}`);
  const files = {};
  for (const name of artifactFiles(target)) {
    const temporary = path.join(destination, `${name}.${process.pid}.tmp`);
    copyFileSync(name === binaryName(target) ? sourceFile : path.join(path.dirname(sourceFile), name), temporary);
    files[name] = sha256(readFileSync(temporary));
  }
  const manifest = {
    schema: 2,
    target,
    revision: identity.revision,
    clean: identity.clean,
    sourceSha256: identity.source.sha256,
    toolchain: identity.source.toolchain,
    compiler,
    backend,
    files,
  };
  const manifestTemporary = path.join(destination, `${manifestName(target)}.${process.pid}.tmp`);
  writeFileSync(manifestTemporary, `${JSON.stringify(manifest, null, 2)}\n`);
  for (const name of artifactFiles(target)) {
    renameSync(path.join(destination, `${name}.${process.pid}.tmp`), path.join(destination, name));
  }
  renameSync(manifestTemporary, path.join(destination, manifestName(target)));
}

export function validateArtifacts({
  directory = nativeDirectory,
  source = sourceSnapshot(),
  required = [],
  revision,
  strict = false,
  selected,
} = {}) {
  const included = new Set();
  if (selected) {
    for (const target of selected) included.add(target);
  } else {
    for (const name of readdirSync(directory)) {
      if (artifactFiles(wasiTarget).includes(name)) included.add(wasiTarget);
      else {
        const match = /^knip-native\.(.+)\.(?:node|json|wasm)$/.exec(name);
        if (match) included.add(match[1]);
      }
    }
  }
  if (included.size === 0) throw new Error('No native artifacts found. Build the host addon before packing.');
  for (const target of required) {
    if (!included.has(target)) throw new Error(`Missing native artifact: ${target}`);
  }
  let collectedRevision;
  for (const target of included) {
    if (!releaseTargets.includes(target)) throw new Error(`Unexpected native artifact: ${target}`);
    const manifest = path.join(directory, manifestName(target));
    if (!existsSync(manifest)) throw new Error(`Missing native binary or provenance: ${target}`);
    const record = JSON.parse(readFileSync(manifest, 'utf8'));
    if (record.schema !== 2 || record.target !== target) throw new Error(`Invalid native provenance: ${target}`);
    if (record.sourceSha256 !== source.sha256 || record.toolchain !== source.toolchain) {
      throw new Error(`Stale or foreign native source: ${target}. Rebuild from this checkout.`);
    }
    if (!record.compiler?.startsWith(`rustc ${source.toolchain} `)) {
      throw new Error(`Unexpected native compiler: ${target}`);
    }
    const names = artifactFiles(target);
    if (!record.files || Object.keys(record.files).length !== names.length) {
      throw new Error(`Invalid native artifact file manifest: ${target}`);
    }
    for (const name of names) {
      const file = path.join(directory, name);
      if (!existsSync(file)) throw new Error(`Missing native binary or provenance: ${name}`);
      if (sha256(readFileSync(file)) !== record.files[name])
        throw new Error(`Native artifact checksum mismatch: ${name}`);
    }
    if (!/^[a-f0-9]{40}$/.test(record.revision)) throw new Error(`Invalid native source revision: ${target}`);
    if (revision && record.revision !== revision) throw new Error(`Native source revision mismatch: ${target}`);
    if (strict && record.clean !== true)
      throw new Error(`Native artifact was built from uncommitted inputs: ${target}`);
    if (strict && collectedRevision && record.revision !== collectedRevision) {
      throw new Error(`Mixed native source revisions: ${target}`);
    }
    collectedRevision = record.revision;
  }
  return [...included];
}

export function expectedRevision() {
  return process.env.KNIP_NATIVE_REVISION || git(packageDirectory, ['rev-parse', 'HEAD']);
}
