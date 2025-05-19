import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import type { PackageJson } from '../../types/package-json.js';
import { toEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';

// https://tsx.is

const title = 'tsx';

const enablers = ['tsx'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json'];

const packageJsonPath = (id: PackageJson) => id;

const resolveConfig: ResolveConfig<PackageJson> = localConfig => {
  const scripts = localConfig.scripts;

  const entries = [];

  if (scripts && Object.keys(scripts).some(script => /(?<=^|\s)tsx\s(.*)--test/.test(scripts[script]))) {
    const patterns = [
      '**/*{.,-,_}test.?(c|m)(j|t)s',
      '**/test-*.?(c|m)(j|t)s',
      '**/test.?(c|m)(j|t)s',
      '**/test/**/*.?(c|m)(j|t)s',
    ];
    entries.push(...patterns.map(id => toEntry(id)));
  }

  return entries;
};

const args = {
  positional: true,
  nodeImportArgs: true,
  args: (args: string[]) => args.filter(arg => arg !== 'watch'),
};

export default {
  title,
  isEnabled,
  packageJsonPath,
  config,
  resolveConfig,
  args,
} satisfies Plugin;
