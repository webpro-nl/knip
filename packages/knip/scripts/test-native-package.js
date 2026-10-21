import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import posix from 'node:path/posix';
import win32 from 'node:path/win32';
import { pathToFileURL } from 'node:url';

const path = process.platform === 'win32' ? win32 : posix;
const directory = path.resolve(process.argv[2]);
const webcontainer = process.argv.includes('--webcontainer');
if (webcontainer) Object.defineProperty(process.versions, 'webcontainer', { value: 'test' });
const require = createRequire(path.join(directory, 'package.json'));
const native = require('knip/native');
assert.deepEqual(native.extractSpecifiers('index.js', "import './library.js';"), ['./library.js']);
const { createNativeGraphUsage } = await import(
  pathToFileURL(path.join(directory, 'node_modules/knip/dist/native-graph.js')).href
);
const { createImports } = await import(
  pathToFileURL(path.join(directory, 'node_modules/knip/dist/util/create-imports.js')).href
);
const entry = '/\ud800/entry';
const namespace = '\ud800Namespace';
const graph = createNativeGraphUsage(
  new Map([
    [
      '/\ud800/source',
      {
        exports: new Map(),
        importedBy: {
          ...createImports(),
          reExportAs: new Map([['\ud800', new Map([[namespace, new Set([entry])]])]]),
        },
      },
    ],
  ]),
  new Set([entry])
);
assert.deepEqual(graph.isReferenced('/\ud800/source', '\ud800.member', { traverseEntries: false }), [
  false,
  entry,
  new Set([`${namespace}.member`]),
]);
const fixture = realpathSync(mkdtempSync(path.join(tmpdir(), 'knip-native-package-')));
try {
  writeFileSync(path.join(fixture, 'package.json'), JSON.stringify({ name: 'native-package-test', type: 'module' }));
  writeFileSync(path.join(fixture, 'index.js'), "import { used } from './library.js'; console.log(used);\n");
  writeFileSync(path.join(fixture, 'library.js'), 'export const used = 1; export const unused = 2;\n');
  const preload = path.join(fixture, 'webcontainer.cjs');
  if (webcontainer)
    writeFileSync(preload, "Object.defineProperty(process.versions, 'webcontainer', { value: 'test' });\n");
  const result = spawnSync(
    process.execPath,
    [
      ...process.execArgv,
      ...(webcontainer ? ['--require', preload] : []),
      path.join(directory, 'node_modules/knip/bin/knip.js'),
      '--directory',
      fixture,
      '--include',
      'exports',
      '--reporter',
      'json',
    ],
    { encoding: 'utf8' }
  );
  if (result.error) throw result.error;
  assert.equal(result.status, 1, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  const unused = [];
  for (const issue of report.issues) {
    for (const item of issue.exports) unused.push(item.name);
  }
  assert.deepEqual(unused, ['unused']);
  console.log(
    `Packed addon and CLI passed on ${process.platform}-${process.arch}${process.execArgv.includes('--no-addons') ? ' with native addons disabled' : ''}.`
  );
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
