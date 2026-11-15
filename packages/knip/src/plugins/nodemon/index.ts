import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { isFile } from '../../util/fs.ts';
import { toConfig } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://github.com/remy/nodemon/blob/v3.1.14/README.md#config-files

const title = 'nodemon';

const enablers = ['nodemon'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

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
  string: ['exec'],
  fromArgs: ['exec'],
  resolveInputs: (parsed, { cwd, manifest }) => {
    if (parsed.exec) return [];
    if (typeof parsed.config === 'string') return [toConfig('nodemon', parsed.config, { dir: cwd })];
    if (isFile(cwd, 'nodemon.json')) return [toConfig('nodemon', 'nodemon.json', { dir: cwd })];
    return 'nodemonConfig' in manifest ? [toConfig('nodemon', 'package.json', { dir: cwd })] : [];
  },
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  resolveConfig,
  args,
};

export default plugin;
