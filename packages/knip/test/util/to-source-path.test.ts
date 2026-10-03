import assert from 'node:assert/strict';
import test from 'node:test';
import type { ConfigurationChief, Workspace } from '../../src/ConfigurationChief.ts';
import { getModuleSourcePathHandler, toSourceMappedSpecifiers } from '../../src/util/to-source-path.ts';
import { join } from '../../src/util/path.ts';
import { resolve } from '../helpers/resolve.ts';
const cwd = resolve('fixtures/resolution/jsx-dist-source-map');
const srcDir = join(cwd, 'src');
const outDir = join(cwd, 'dist');
const workspace = { sourceMaps: [{ srcDir, outDir }] } as Workspace;
const chief = { cwd, findWorkspaceByFilePath: () => workspace } as unknown as ConfigurationChief;
test('Map JSX output paths back to TSX source files', () => {
  const distPath = join(outDir, 'index.jsx');
  assert.equal(getModuleSourcePathHandler(chief)(distPath), join(srcDir, 'index.tsx'));
  assert.deepEqual(toSourceMappedSpecifiers(workspace, distPath), [
    join(srcDir, 'index.{js,mjs,cjs,jsx,ts,tsx,mts,cts}'),
  ]);
});
