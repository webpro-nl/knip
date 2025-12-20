#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { rolldown } from 'rolldown';

const { values: args } = parseArgs({
  options: {
    target: { type: 'string' },
    publish: { type: 'boolean', default: false },
    'pre-release': { type: 'boolean', default: false },
  },
});

if (args.publish && !process.env.OVSX_PAT) {
  console.error('Error: OVSX_PAT environment variable is required for publishing to Open VSX');
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const nm = join(dist, 'node_modules');

const targets = {
  'darwin-arm64': 'darwin-arm64',
  'darwin-x64': 'darwin-x64',
  'linux-x64': 'linux-x64-gnu',
  'linux-arm64': 'linux-arm64-gnu',
  'win32-x64': 'win32-x64-msvc',
  'win32-arm64': 'win32-arm64-msvc',
};

const ext = ['vscode', /^@oxc-resolver\/binding-/, 'jiti', /jiti\/dist/];
const extSession = [...ext, 'knip/session'];

const cmd = args.publish ? 'publish' : 'package';
const flags = [args['pre-release'] && '--pre-release', '--no-dependencies'].filter(Boolean).join(' ');
const vsixFiles = [];

rmSync(dist, { recursive: true, force: true });

const bundle = async (input, output, external = ext, paths) => {
  const build = await rolldown({ input: join(root, input), external, platform: 'node' });
  await build.write({ format: 'cjs', minify: true, file: join(dist, output), paths });
};

const paths = { 'knip/session': '../../knip/session.js' };

await bundle('../knip/src/session/index.ts', 'node_modules/knip/session.js');
await bundle('../mcp-server/src/tools.js', 'node_modules/@knip/mcp/tools.js', extSession, paths);
await bundle('../language-server/src/constants.js', 'node_modules/@knip/language-server/constants.js');
await bundle('../language-server/src/index.js', 'node_modules/@knip/language-server/index.js', extSession, paths);
await bundle('src/index.js', 'extension.js', [...extSession, '@knip/mcp/tools', '@knip/language-server/constants'], {
  'knip/session': './node_modules/knip/session.js',
  '@knip/mcp/tools': './node_modules/@knip/mcp/tools.js',
  '@knip/language-server/constants': './node_modules/@knip/language-server/constants.js',
});

const jitiSrc = join(dirname(fileURLToPath(import.meta.resolve('knip'))), '..', 'node_modules', 'jiti');
const jitiDst = join(nm, 'jiti');
cpSync(jitiSrc, jitiDst, { recursive: true, dereference: true });

cpSync(join(root, '../mcp-server/docs'), join(nm, '@knip/docs'), { recursive: true });

// Remove "type": "module" from package.json so CJS extension.js works
const pkgPath = join(root, 'package.json');
const pkgOriginal = readFileSync(pkgPath, 'utf8');
const pkg = JSON.parse(pkgOriginal);
delete pkg.type;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

for (const [target, binding] of args.target ? [[args.target, targets[args.target]]] : Object.entries(targets)) {
  rmSync(join(nm, '@oxc-resolver'), { recursive: true, force: true });
  mkdirSync(join(nm, `@oxc-resolver/binding-${binding}`), { recursive: true });

  const tmp = mkdtempSync(join(tmpdir(), 'oxc-'));
  execSync(`npm pack @oxc-resolver/binding-${binding}`, { cwd: tmp, stdio: 'pipe' });
  execSync('tar -xzf *.tgz', { cwd: tmp, stdio: 'pipe' });
  cpSync(
    execSync(`find ${tmp}/package -name "*.node"`, { encoding: 'utf-8' }).trim(),
    join(nm, `@oxc-resolver/binding-${binding}/resolver.${binding}.node`)
  );
  cpSync(join(tmp, 'package/package.json'), join(nm, `@oxc-resolver/binding-${binding}/package.json`));
  rmSync(tmp, { recursive: true });

  execSync(`pnpm vsce ${cmd} ${flags} --target ${target}`, { cwd: root, stdio: 'inherit' });

  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  vsixFiles.push(join(root, `${pkg.name}-${target}-${pkg.version}.vsix`));
}

if (args.publish) {
  for (const vsix of vsixFiles) {
    execSync(`ovsx publish ${vsix}`, { cwd: root, stdio: 'inherit' });
  }
}

// Restore original package.json
writeFileSync(pkgPath, pkgOriginal);
