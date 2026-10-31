import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { dirname, join } from '../../src/util/path.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { createOptions } from '../helpers/create-options.ts';

const imports = ['@cspell/dict-typescript/cspell-ext.json', '@cspell/dict-cryptocurrencies/cspell-ext.json'];
const json = JSON.stringify({ import: imports });
const yaml = `import:\n${imports.map(id => `  - '${id}'`).join('\n')}\n`;
const toml = `import = ${JSON.stringify(imports)}\n`;

for (const [configFile, content] of [
  ['cspell.jsonc', json],
  ['.cspell.jsonc', json],
  ['cspell.config.jsonc', json],
  ['.cspell.config.json', json],
  ['.cspell.yaml', yaml],
  ['.vscode/cspell.json', json],
  ['.vscode/.cspell.json', json],
  ['.config/cspell.json', json],
  ['.config/.cspell.json', json],
  ['.config/cspell.jsonc', json],
  ['.config/cspell.config.yaml', yaml],
  ['.config/.cspell.config.toml', toml],
  ['.config/cspell.yml', yaml],
  ['cspell.config.cts', `module.exports = ${json};`],
  ['.cspell.config.mjs', `export default ${json};`],
]) {
  test(`Find CSpell dependencies in ${configFile}`, async () => {
    const cwd = await copyFixture('fixtures/plugins/cspell-config-locations');
    const configPath = join(cwd, configFile);
    await mkdir(dirname(configPath), { recursive: true });
    await writeFile(configPath, content);

    const options = await createOptions({ cwd });
    const { issues, counters } = await main(options);

    assert(issues.unlisted[configFile]['@cspell/dict-cryptocurrencies']);
    assert(!issues.devDependencies['package.json']['@cspell/dict-typescript']);
    assert(issues.devDependencies['package.json']['@cspell/dict-node']);
    assert.deepEqual(counters, {
      ...baseCounters,
      devDependencies: 2,
      unlisted: 1,
      processed: /\.[cm]?[jt]s$/.test(configFile) ? 1 : 0,
      total: /\.[cm]?[jt]s$/.test(configFile) ? 1 : 0,
    });
  });
}
