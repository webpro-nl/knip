import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { createOptions } from '../helpers/create-options.ts';

test('Fix catalog entries (pnpm-workspace.yaml)', async () => {
  const cwd = await copyFixture('fixtures/dependencies/catalog-named');
  const options = await createOptions({ cwd, isFix: true });
  const { issues, counters } = await main(options);

  assert(issues.catalog['pnpm-workspace.yaml']['default.lodash'].isFixed);
  assert(!issues.catalog['pnpm-workspace.yaml']['frontend.@nu/xt']);
  assert(issues.catalog['pnpm-workspace.yaml']['backend.fastify'].isFixed);
  assert(!issues.catalog['pnpm-workspace.yaml']['tools.prettier'].isFixed);
  assert.equal(counters.catalog, 1);

  assert.equal(
    await readFile(join(cwd, 'pnpm-workspace.yaml'), 'utf8'),
    `packages:
  - 'packages/*'

catalog:
  react: ^18.0.0

catalogs:
  frontend:
    vue: ^3.0.0
    "@nu/xt": ^3.0.0
  backend:
    '@ex/press': ^4.18.0
  tools: { prettier: ^3.0.0 }

overrides:
  '@nu/xt@^3': 'catalog:frontend'
`
  );
});

test('Fix catalog entries (.yarnrc.yml)', async () => {
  const cwd = await copyFixture('fixtures/dependencies/catalog-yarn');
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

test('Fix catalog entries split across pnpm-workspace.yaml include files', async () => {
  const cwd = await copyFixture('fixtures/dependencies/catalog-pnpm-include-split');
  const options = await createOptions({ cwd, isFix: true, fixTypes: ['catalog'] });
  const { issues } = await main(options);

  assert(issues.catalog['pnpm-workspace.yaml']['default.lodash'].isFixed);
  assert(issues.catalog['catalogs.pnpm-workspace.yaml']['react.react-dom'].isFixed);

  assert.equal(
    await readFile(join(cwd, 'pnpm-workspace.yaml'), 'utf8'),
    `include:
  ./catalogs.pnpm-workspace.yaml: [catalogs.react]
packages:
  - "packages/*"
catalog:
  zod: ^4.4.3
catalogs:
  legacy:
    vue: ^2.7.0
`
  );

  assert.equal(
    await readFile(join(cwd, 'catalogs.pnpm-workspace.yaml'), 'utf8'),
    `catalogs:
  react:
    react: ^19.0.0
`
  );
});
