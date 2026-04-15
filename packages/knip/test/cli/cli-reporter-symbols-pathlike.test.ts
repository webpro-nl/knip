import assert from 'node:assert/strict';
import { test } from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/prettier');

test('knip --reporter symbols (path-like specifier)', () => {
  const expected = `Unused devDependencies (1)
prettier  package.json:5:6
Unlisted dependencies (3)
@company/prettier-config  package.json
prettier-plugin-xml       prettier.config.js
prettier-plugin-astro     prettier.config.js`;

  const result = exec('knip --reporter symbols', { cwd }).stdout.replace(/ +$/gm, '');

  assert.equal(result, expected);
});
