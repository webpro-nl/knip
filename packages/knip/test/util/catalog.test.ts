import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getCatalogContainer } from '../../src/util/catalog.ts';

test('Should load a pnpm catalog from a Windows drive root', async () => {
  const catalog = { zod: '4.4.3' };
  const container = await getCatalogContainer('Z:/', {}, 'Z:/package.json', 'Z:/pnpm-workspace.yaml', { catalog });

  assert.equal(container.filePath, 'Z:/pnpm-workspace.yaml');
  assert.equal(container.catalog, catalog);
});
