import type { IsPluginEnabled, ParseConfig, Plugin, Resolve, ResolveConfig } from '../../types/config.ts';
import { toDependency, toEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://github.com/tarmolov/git-hooks-js

const title = 'git-hooks';

const enablers = ['git-hooks'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const isRootOnly = true;

// Every executable file in .githooks/<hook-name>/ runs as a hook
const config = ['.githooks/*/{!(*.*),*.sh}'];

const entry = ['.githooks/*/*.?(c|m)[jt]s'];

const parseConfig: ParseConfig = source => source;

const resolveConfig: ResolveConfig = (script, options) => {
  const entries = (options.config.entry ?? entry).map(id => toEntry(id));
  if (!script || options.isProduction) return entries;
  // Git runs hooks from the repository root
  const inputs = options.getInputsFromScripts(String(script), { optionalBinaries: true });
  return [...entries, ...inputs.map(input => ({ ...input, dir: options.cwd }))];
};

// git-hooks installs itself through its own postinstall script, so nothing in the project references it
const resolve: Resolve = () => [toDependency('git-hooks')];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  isRootOnly,
  config,
  entry,
  parseConfig,
  resolveConfig,
  resolve,
};

export default plugin;
