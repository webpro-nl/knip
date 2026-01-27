import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { main } from '../../src/index.js';
import { join } from '../../src/util/path.js';
import { copyFixture } from '../helpers/copy-fixture.js';
import { createOptions } from '../helpers/create-options.js';

test('Fix catalog entries (package.json)', async () => {
  const cwd = await copyFixture('fixtures/catalog-named-package-json');
  const options = await createOptions({ cwd, isFix: true });
  const { issues } = await main(options);

  assert(issues.catalog['package.json']['default.lodash']);
  assert(issues.catalog['package.json']['frontend.nuxt']);
  assert(issues.catalog['package.json']['backend.fastify']);

  assert.equal(
    await readFile(join(cwd, 'package.json'), 'utf8'),
    `{
  "name": "@fixtures/catalog-named-package-json",
  "private": true,
  "dependencies": {
    "react": "catalog:",
    "vue": "catalog:frontend",
    "express": "catalog:backend"
  },
  "workspaces": {
    "packages": [
      "packages/*"
    ],
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
}
`
  );
});
