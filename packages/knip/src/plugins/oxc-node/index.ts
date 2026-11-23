import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import type { PackageJson } from '../../types/package-json.ts';
import { toEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { args as nodeArgs } from '../node/index.ts';

// https://oxc.rs/docs/guide/usage/oxc-node.html

const title = 'oxc-node';

const enablers = ['@oxc-node/cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json'];

const packageJsonPath = (id: PackageJson) => id;

const resolveConfig: ResolveConfig<PackageJson> = localConfig => {
  const scripts = localConfig.scripts;

  const entries = [];

  if (scripts && Object.values(scripts).some(script => /(?<=^|\s)oxnode\s(.*)--test/.test(script))) {
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
  ...nodeArgs,
  binaries: ['oxnode'],
  string: [...nodeArgs.string, 'exclude', 'include', 'tsconfig'],
  args: (args: string[]) => (args[0] === 'watch' ? args.slice(1) : args),
} satisfies Args;

const plugin: Plugin = {
  title,
  isEnabled,
  packageJsonPath,
  config,
  resolveConfig,
  args,
};

export default plugin;
