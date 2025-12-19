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

const banner = `import{createRequire}from'module';import{fileURLToPath}from'url';import{dirname}from'path';const require=createRequire(import.meta.url),__filename=fileURLToPath(import.meta.url),__dirname=dirname(__filename);`;
const ext = ['vscode', /^@oxc-resolver\/binding-/];
const extSession = [...ext, 'knip/session'];

const cmd = args.publish ? 'publish' : 'package';
const flags = [args['pre-release'] && '--pre-release', '--no-dependencies'].filter(Boolean).join(' ');

rmSync(dist, { recursive: true, force: true });

const bundle = async (input, output, external = ext, paths) => {
  const build = await rolldown({ input: join(root, input), external, platform: 'node' });
  await build.write({ format: 'esm', minify: true, file: join(dist, output), paths });
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

for (const f of ['extension.js', 'node_modules/knip/session.js']) {
  const p = join(dist, f);
  writeFileSync(p, banner + readFileSync(p, 'utf8'));
}

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
}
