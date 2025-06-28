import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import type { PackageJson } from '../../types/package-json.js';
import { toEntry, toProductionEntry } from '../../util/input.js';

const title = 'Node.js';

const isEnabled: IsPluginEnabled = () => true;

const config = ['package.json'];

const packageJsonPath = (id: PackageJson) => id;

const resolveConfig: ResolveConfig<PackageJson> = localConfig => {
  const scripts = localConfig.scripts;

  const entries = [toProductionEntry('server.js')];

  if (scripts && Object.values(scripts).some(script => /(?<=^|\s)node\s(.*)--test/.test(script))) {
    // From https://nodejs.org/api/test.html#running-tests-from-the-command-line
    const patterns = [
      '**/*{.,-,_}test.{cjs,mjs,js,cts,mts,ts}',
      '**/test-*.{cjs,mjs,js,cts,mts,ts}',
      '**/test.{cjs,mjs,js,cts,mts,ts}',
      '**/test/**/*.{cjs,mjs,js,cts,mts,ts}',
    ];
    entries.push(...patterns.map(id => toEntry(id)));
  }

  return entries;
};

const args = {
  positional: true,
  nodeImportArgs: true,
  resolve: ['test-reporter'],
  boolean: [
    'deprecation',
    'experimental-strip-types',
    'experimental-transform-types',
    'harmony',
    'inspect-brk',
    'inspect-wait',
    'inspect',
    'test-only',
    'test',
    'warnings',
    'watch',
  ],
  args: (args: string[]) => args.filter(arg => !/--test-reporter[= ](spec|tap|dot|junit|lcov)/.test(arg)),
};

export default {
  title,
  isEnabled,
  packageJsonPath,
  config,
  resolveConfig,
  args,
} satisfies Plugin;
