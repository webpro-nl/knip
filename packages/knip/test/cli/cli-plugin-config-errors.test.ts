import assert from 'node:assert/strict';
import { readFile, rm, writeFile } from 'node:fs/promises';
import test from 'node:test';
import { join } from '../../src/util/path.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { exec } from '../helpers/exec.ts';

for (const [value, message] of [
  ['"Missing environment"', 'Missing environment'],
  ['undefined', 'undefined'],
  ['null', 'null'],
  ['new Error("Missing environment")', 'Missing environment'],
]) {
  for (const isAsync of [false, true]) {
    const functionSource = `${isAsync ? 'async ' : ''}() => { throw ${value}; }`;

    test(`Optional config failure retains AST entries (${value}, async: ${isAsync})`, async () => {
      const cwd = await copyFixture('fixtures/plugins/next-page-extensions');
      try {
        const configPath = join(cwd, 'next.config.js');
        const config = await readFile(configPath, 'utf8');
        await writeFile(configPath, `${config}\nmodule.exports = ${functionSource};\n`);

        const result = exec('knip --no-progress --reporter json --include files', { cwd });
        assert.equal(result.stderr, '');
        assert.equal(result.status, 1);
        assert.deepEqual(JSON.parse(result.stdout), {
          issues: [{ file: 'src/unused.ts', files: [{ name: 'src/unused.ts' }] }],
        });
      } finally {
        await rm(cwd, { recursive: true, force: true });
      }
    });

    test(`Required config failure reports its cause (${value}, async: ${isAsync})`, async () => {
      const cwd = await copyFixture('fixtures/plugin-config/resolve-config-error');
      try {
        await writeFile(join(cwd, 'vite.config.ts'), `export default ${functionSource};\n`);

        const result = exec('knip --no-progress --no-exit-code', { cwd });
        assert.equal(result.status, 2);
        assert.equal(
          result.stderr,
          `ERROR: Error loading vite.config.ts (${message})\nERROR: Please fix or visit https://knip.dev/reference/known-issues`
        );
      } finally {
        await rm(cwd, { recursive: true, force: true });
      }
    });
  }
}
