import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/astro-sharp-image-service');

test('Find no unused sharp dependency when Astro sharpImageService is configured', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  assert(!issues.dependencies['package.json']?.['sharp']);
});
