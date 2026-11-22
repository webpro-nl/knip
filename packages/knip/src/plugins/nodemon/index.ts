import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://github.com/remy/nodemon/blob/v3.1.14/README.md#config-files

const title = 'nodemon';

const enablers = ['nodemon'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['nodemon.json', 'package.json'];

const packageJsonPath = 'nodemonConfig';

const resolveConfig: ResolveConfig<{ exec?: string }> = (config, options) => {
  if (!config.exec) return [];
  const inputs = options.getInputsFromScripts(config.exec, { optionalBinaries: true });
  for (const input of inputs) input.dir ??= options.cwd;
  return inputs;
};

const args: Args = {
  positional: false,
  nodeImportArgs: true,
  alias: { exec: ['x'] },
  fromArgs: ['exec'],
  config: ['config'],
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  packageJsonPath,
  resolveConfig,
  args,
};

export default plugin;
