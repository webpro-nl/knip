import type { EnablerPatterns } from '#p/types/config.js';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '#p/types/plugins.js';
import { hasDependency } from '#p/util/plugin.js';
import type { NestConfig } from './types.js';

// https://docs.nestjs.com

const title = 'Nest';

const enablers: EnablerPatterns = [/^@nestjs\/.*/];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['nest-cli.json', '.nestcli.json', '.nest-cli.json', 'nest.json'];

const resolveConfig: ResolveConfig<NestConfig> = async config => {
  const dependencies = config?.collection ? [config.collection] : [];
  return [...dependencies];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
