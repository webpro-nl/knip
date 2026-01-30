import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { main } from '../../src/index.js';
import { join } from '../../src/util/path.js';
import { copyFixture } from '../helpers/copy-fixture.js';
import { createOptions } from '../helpers/create-options.js';

test('Fix catalog entries (pnpm-workspace.yaml)', async () => {
  const cwd = await copyFixture('fixtures/catalog-named');
  const options = await createOptions({ cwd, isFix: true });
  const { issues } = await main(options);

  assert(issues.catalog['pnpm-workspace.yaml']['default.lodash']);
  assert(issues.catalog['pnpm-workspace.yaml']['frontend.@nu/xt']);
  assert(issues.catalog['pnpm-workspace.yaml']['backend.fastify']);

  assert.equal(
    await readFile(join(cwd, 'pnpm-workspace.yaml'), 'utf8'),
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
});

test('Fix catalog entries (.yarnrc.yml)', async () => {
  const cwd = await copyFixture('fixtures/catalog-yarn');
  const options = await createOptions({ cwd, isFix: true });
  const { issues } = await main(options);

  assert(issues.catalog['.yarnrc.yml']['default.@lo/dash']);

  assert.equal(
    await readFile(join(cwd, '.yarnrc.yml'), 'utf8'),
    `packages:
  - "packages/*"

catalog:
  solid-js: 1.9.10
  typescript: ^5.0.0
`
  );
});
