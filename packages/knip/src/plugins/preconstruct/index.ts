import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toEntry } from '../../util/input.ts';
import { join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { PreconstructConfig } from './types.ts';

// https://preconstruct.tools/configuration

const title = 'Preconstruct';

const enablers = ['@preconstruct/cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json'];

const resolveConfig: ResolveConfig<PreconstructConfig> = async config => {
  return (config.entrypoints ?? []).map(id =>
    toEntry(join('src', id), { production: true, allowIncludeExports: true })
  );
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;
