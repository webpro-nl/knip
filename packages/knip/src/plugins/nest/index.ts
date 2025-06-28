import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { NestConfig } from './types.js';

// https://docs.nestjs.com

const title = 'Nest';

const enablers = [/^@nestjs\/.*/];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['nest-cli.json', '.nestcli.json', '.nest-cli.json', 'nest.json'];

const resolveConfig: ResolveConfig<NestConfig> = async config => {
  const inputs = config?.collection ? [config.collection] : [];
  return [...inputs].map(id => toDependency(id));
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
