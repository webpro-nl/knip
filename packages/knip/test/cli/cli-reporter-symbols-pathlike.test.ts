import assert from 'node:assert/strict';
import { test } from 'node:test';
import { exec } from '../helpers/exec.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/prettier');

test('knip --reporter symbols (path-like specifier)', () => {
  const expected = `Unused devDependencies (1)
prettier  package.json:5:6
Unlisted dependencies (2)
prettier-plugin-xml    prettier.config.js
prettier-plugin-astro  prettier.config.js
Unresolved imports (1)
@company/prettier-config  package.json`;

  const result = exec('knip --reporter symbols', { cwd }).stdout;

  assert.equal(result, expected);
});
