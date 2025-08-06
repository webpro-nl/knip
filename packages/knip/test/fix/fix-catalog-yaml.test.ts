import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { main } from '../../src/index.js';
import { join, resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';

const cwd = resolve('fixtures/catalog-named');
const manifestPath = join(cwd, 'pnpm-workspace.yaml');

const originalFile = await readFile(manifestPath);

test('Fix catalog entries', async () => {
  const { issues } = await main({
    ...baseArguments,
    cwd,
    isFix: true,
  });

  assert(issues.catalog['pnpm-workspace.yaml']['default.lodash']);
  assert(issues.catalog['pnpm-workspace.yaml']['frontend.nuxt']);
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
    express: ^4.18.0
`
  );

  await writeFile(manifestPath, originalFile);
});
