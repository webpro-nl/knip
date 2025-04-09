import type { IsPluginEnabled, Plugin, ResolveEntryPaths } from '../../types/config.js';
import type { PackageJson } from '../../types/package-json.js';
import { toEntry, toProductionEntry } from '../../util/input.js';

const title = 'Node.js';

const isEnabled: IsPluginEnabled = () => true;

const config = ['package.json'];

const packageJsonPath = (id: PackageJson) => id;

const resolveEntryPaths: ResolveEntryPaths<PackageJson> = localConfig => {
  const scripts = localConfig.scripts;

  const entries = [toProductionEntry('server.js')];

  if (scripts && Object.keys(scripts).some(script => /(?<=^|\s)node\s(.*)--test/.test(scripts[script]))) {
    const patterns = ['**/*{.,-,_}test.?(c|m)js', '**/test-*.?(c|m)js', '**/test.?(c|m)js', '**/test/**/*.?(c|m)js'];
    entries.push(...patterns.map(id => toEntry(id)));
  }

  return entries;
};

const args = {
  positional: true,
  nodeImportArgs: true,
  resolve: ['test-reporter'],
  args: (args: string[]) => args.filter(arg => !/--test-reporter[= ](spec|tap|dot|junit|lcov)/.test(arg)),
};

export default {
  title,
  isEnabled,
  packageJsonPath,
  config,
  resolveEntryPaths,
  args,
} satisfies Plugin;
