import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import posix from 'node:path/posix';
import win32 from 'node:path/win32';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { bundleWasi } from './bundle-wasi.js';
import { binaryName, buildIdentity, releaseTargets, wasiTarget, writeArtifact } from './native-artifacts.js';

const directory = fileURLToPath(new URL('../native/', import.meta.url));
const { values } = parseArgs({
  options: { target: { type: 'string' }, napi: { type: 'boolean' }, cross: { type: 'string' } },
});
if (values.cross && (!values.napi || (values.cross !== 'gnu' && values.cross !== 'zig'))) {
  throw new Error('--cross requires --napi and must be gnu or zig');
}
const identity = buildIdentity();
const explicitTarget = values.target ?? process.env.CARGO_BUILD_TARGET;
const rustc = spawnSync('rustc', ['-vV'], { encoding: 'utf8', cwd: directory });
if (rustc.error) throw rustc.error;
if (rustc.status !== 0) throw new Error(rustc.stderr);
const host = rustc.stdout.match(/^host: (.+)$/m)?.[1];
const target = explicitTarget ?? host;
if (!releaseTargets.includes(target)) throw new Error(`Unsupported Rust target: ${target}`);
if (target === wasiTarget && !values.napi) throw new Error('WASI builds require --napi');
const newline = rustc.stdout.indexOf('\n');
const compiler = newline === -1 ? rustc.stdout : rustc.stdout.slice(0, newline);
if (!compiler.startsWith(`rustc ${identity.source.toolchain} `))
  throw new Error(`Unexpected Rust compiler: ${compiler}`);

const library = target.includes('-windows-')
  ? 'knip_native.dll'
  : target.endsWith('-apple-darwin')
    ? 'libknip_native.dylib'
    : 'libknip_native.so';
const path = process.platform === 'win32' ? win32 : posix;
let temporary;
try {
  let artifact;
  if (values.napi) {
    temporary = mkdtempSync(path.join(tmpdir(), 'knip-native-build-'));
    const { NapiCli } = await import('@napi-rs/cli');
    const { task } = await new NapiCli().build({
      cwd: directory,
      manifestPath: 'Cargo.toml',
      packageJsonPath: '../package.json',
      outputDir: temporary,
      target,
      release: true,
      platform: target === wasiTarget,
      noJsBinding: true,
      useNapiCross: values.cross === 'gnu',
      crossCompile: values.cross === 'zig',
      cargoOptions: ['--locked'],
    });
    await task;
    if (target === wasiTarget) {
      const { rolldown } = await import('rolldown');
      await bundleWasi(temporary, rolldown);
    }
    const binaries = readdirSync(temporary).filter(name =>
      target === wasiTarget ? name === binaryName(target) : name.endsWith('.node')
    );
    if (binaries.length !== 1) throw new Error('Native build must produce exactly one addon');
    artifact = path.join(temporary, binaries[0]);
  } else {
    const args = ['build', '--release', '--locked', '--target', target];
    const result = spawnSync('cargo', args, { cwd: directory, stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`Native build failed (${result.status})`);
    const targetDirectory = path.resolve(directory, process.env.CARGO_TARGET_DIR ?? 'target');
    const release = path.join(targetDirectory, target, 'release');
    artifact = path.join(release, library);
  }
  const after = buildIdentity();
  if (JSON.stringify(identity) !== JSON.stringify(after)) throw new Error('Native inputs changed during the build');
  writeArtifact(
    artifact,
    directory,
    target,
    identity,
    compiler,
    values.napi ? `napi-${values.cross || 'native'}` : 'cargo'
  );
  if (target === host) {
    const destination = path.join(directory, 'knip-native.node');
    const staged = `${destination}.${process.pid}.tmp`;
    copyFileSync(path.join(directory, binaryName(target)), staged);
    renameSync(staged, destination);
  }
} finally {
  if (temporary) rmSync(temporary, { recursive: true, force: true });
}
