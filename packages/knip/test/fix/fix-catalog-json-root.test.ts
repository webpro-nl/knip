import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { createOptions } from '../helpers/create-options.ts';

test('Fix catalog entries', async () => {
  const cwd = await copyFixture('fixtures/catalog-named-package-json-root');
  const options = await createOptions({ cwd, isFix: true });
  const { issues } = await main(options);

  assert(issues.catalog['package.json']['default.lodash']);
  assert(issues.catalog['package.json']['frontend.@nu/xt']);
  assert(issues.catalog['package.json']['backend.fastify']);

  assert.equal(
    await readFile(join(cwd, 'package.json'), 'utf8'),
    `{
  "name": "@fixtures/catalog-named-package-json-root",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "dependencies": {
    "react": "catalog:",
    "vue": "catalog:frontend",
    "express": "catalog:backend"
  },
  "catalog": {
    "react": "^18.0.0"
  },
  "catalogs": {
    "frontend": {
      "vue": "^3.0.0"
    },
    "backend": {
      "express": "^4.18.0"
    }
  }
}
`
  );
});
