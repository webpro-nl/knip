import type { IsLoadConfig, IsPluginEnabled, ParseConfig, Plugin, Resolve, ResolveConfig } from '../../types/config.ts';
import { toDependency } from '../../util/input.ts';
import { extname } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://github.com/tarmolov/git-hooks-js

const title = 'git-hooks';

const enablers = ['git-hooks'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const isRootOnly = true;

// Every executable file in .githooks/<hook-name>/ runs as a hook
const config = ['.githooks/*/*'];

// Other files with an extension (e.g. .js) are added as entry files, so only read shell scripts
const isLoadConfig: IsLoadConfig = ({ configFileName }) => ['', '.sh'].includes(extname(configFileName));

const parseConfig: ParseConfig = source => source;

const resolveConfig: ResolveConfig = (script, options) => {
  if (!script || options.isProduction) return [];
  // Git runs hooks from the repository root
  const inputs = options.getInputsFromScripts(String(script), { optionalBinaries: true });
  return inputs.map(input => ({ ...input, dir: options.cwd }));
};

// git-hooks installs itself through its own postinstall script, so nothing in the project references it
const resolve: Resolve = () => [toDependency('git-hooks')];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  isRootOnly,
  config,
  isLoadConfig,
  parseConfig,
  resolveConfig,
  resolve,
};

export default plugin;
