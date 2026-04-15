#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { rolldown } from 'rolldown';

// https://marketplace.visualstudio.com/items?itemName=webpro.vscode-knip
// https://marketplace.visualstudio.com/manage/publishers/webpro
// https://open-vsx.org/extension/webpro/vscode-knip
// https://open-vsx.org/user-settings/extensions

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

const currentTarget = `${process.platform}-${process.arch}`;

const ext = ['vscode', 'oxc-parser', /^@oxc-parser\/binding-/, /^@oxc-resolver\/binding-/, 'jiti', /jiti\/dist/];
const extSession = [...ext, 'knip/session'];

const flags = [args['pre-release'] && '--pre-release', '--no-dependencies'].filter(Boolean).join(' ');
const vsixFiles = [];

rmSync(dist, { recursive: true, force: true });

const bundle = async (input, output, external = ext, paths) => {
  const build = await rolldown({ input: join(root, input), external, platform: 'node' });
  await build.write({ format: 'cjs', minify: true, file: join(dist, output), paths });
};

const paths = { 'knip/session': '../../knip/session.js' };

await bundle('../knip/src/session/index.ts', 'node_modules/knip/session.js');

const knipPkg = JSON.parse(readFileSync(join(root, '../knip/package.json'), 'utf8'));
writeFileSync(join(nm, 'knip/package.json'), JSON.stringify({ name: 'knip', version: knipPkg.version }));
await bundle('../mcp-server/src/tools.js', 'node_modules/@knip/mcp/tools.js', extSession, paths);
await bundle('../language-server/src/index.js', 'node_modules/@knip/language-server/index.js', extSession, paths);
await bundle('src/index.js', 'extension.js', [...extSession, '@knip/language-server', '@knip/mcp/tools'], {
  'knip/session': './node_modules/knip/session.js',
  '@knip/mcp/tools': './node_modules/@knip/mcp/tools.js',
  '@knip/language-server': './node_modules/@knip/language-server/index.js',
});

const knipNm = join(dirname(fileURLToPath(import.meta.resolve('knip'))), '..', 'node_modules');

cpSync(join(knipNm, 'jiti'), join(nm, 'jiti'), { recursive: true, dereference: true });
cpSync(join(knipNm, 'oxc-parser'), join(nm, 'oxc-parser'), { recursive: true, dereference: true });

cpSync(join(root, '../mcp-server/src/docs'), join(nm, '@knip/mcp/docs'), { recursive: true });

// Remove "type": "module" from package.json so CJS extension.js works
const pkgPath = join(root, 'package.json');
const pkgOriginal = readFileSync(pkgPath, 'utf8');
const pkg = JSON.parse(pkgOriginal);
delete pkg.type;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

// Copy package.json to dist for test run
const distPkg = { ...pkg, main: './extension.js' };
writeFileSync(join(dist, 'package.json'), JSON.stringify(distPkg, null, 2));

const selectedTargets = args.target
  ? [[args.target, targets[args.target]]]
  : args.publish
    ? Object.entries(targets)
    : [[currentTarget, targets[currentTarget]]];

const packNativeBinding = (scope, name, binding) => {
  rmSync(join(nm, scope), { recursive: true, force: true });
  mkdirSync(join(nm, `${scope}/binding-${binding}`), { recursive: true });
  const tmp = mkdtempSync(join(tmpdir(), 'oxc-'));
  execSync(`npm pack ${scope}/binding-${binding}`, { cwd: tmp, stdio: 'pipe' });
  execSync('tar -xzf *.tgz', { cwd: tmp, stdio: 'pipe' });
  cpSync(
    execSync(`find ${tmp}/package -name "*.node"`, { encoding: 'utf-8' }).trim(),
    join(nm, `${scope}/binding-${binding}/${name}.${binding}.node`)
  );
  cpSync(join(tmp, 'package/package.json'), join(nm, `${scope}/binding-${binding}/package.json`));
  rmSync(tmp, { recursive: true });
};

for (const [target, binding] of selectedTargets) {
  packNativeBinding('@oxc-parser', 'parser', binding);
  packNativeBinding('@oxc-resolver', 'resolver', binding);

  execSync(`pnpm vsce package ${flags} --target ${target}`, { cwd: root, stdio: 'inherit' });

  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  vsixFiles.push(join(root, `${pkg.name}-${target}-${pkg.version}.vsix`));
}

if (args.publish) {
  for (const vsix of vsixFiles) {
    execSync(`pnpm vsce publish --packagePath ${vsix}`, { cwd: root, stdio: 'inherit' });
    execSync(`ovsx publish ${vsix}`, { cwd: root, stdio: 'inherit' });
  }
}

// Restore original package.json
writeFileSync(pkgPath, pkgOriginal);
