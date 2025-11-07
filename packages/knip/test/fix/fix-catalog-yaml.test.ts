import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { test } from 'node:test';
import { main } from '../../src/index.js';
import { join } from '../../src/util/path.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/catalog-named');
const manifestPath = join(cwd, 'pnpm-workspace.yaml');

const originalFile = await readFile(manifestPath);

test('Fix catalog entries (pnpm-workspace.yaml)', async () => {
  const options = await createOptions({ cwd, isFix: true });
  const { issues } = await main(options);

  assert(issues.catalog['pnpm-workspace.yaml']['default.lodash']);
  assert(issues.catalog['pnpm-workspace.yaml']['frontend.@nu/xt']);
  assert(issues.catalog['pnpm-workspace.yaml']['backend.fastify']);

  const fixedFile = await readFile(manifestPath, 'utf-8');

  assert.equal(
    fixedFile,
    `packages:
  - 'packages/*'

catalog:
  react: ^18.0.0

catalogs:
  frontend:
    vue: ^3.0.0
  backend:
    '@ex/press': ^4.18.0
`
  );

  await writeFile(manifestPath, originalFile);
});
