import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { test } from 'node:test';
import { main } from '../../src/index.js';
import { join, resolve } from '../../src/util/path.js';
import { createOptions } from '../helpers/create-options.js';

const cwd = resolve('fixtures/catalog-named-package-json-root');
const manifestPath = join(cwd, 'package.json');

const originalFile = await readFile(manifestPath);

test('Fix catalog entries', async () => {
  const options = await createOptions({ cwd, isFix: true });
  const { issues } = await main(options);

  assert(issues.catalog['package.json']['default.lodash']);
  assert(issues.catalog['package.json']['frontend.@nu/xt']);
  assert(issues.catalog['package.json']['backend.fastify']);

  const fixedFile = await readFile(manifestPath, 'utf-8');

  assert.equal(
    fixedFile,
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

  await writeFile(manifestPath, originalFile);
});
