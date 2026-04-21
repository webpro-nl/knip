import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/astro2');

test('Astro plugin picks up vite.resolve.alias from astro.config.mjs', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  assert.equal('src/lib/database-local.ts' in issues.files, false);
  assert.equal('src/lib/auth-local.ts' in issues.files, false);
  assert.equal('src/lib/mailer-local.ts' in issues.files, false);
});
