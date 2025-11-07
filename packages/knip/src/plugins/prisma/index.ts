import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';
import type { PrismaConfig } from './types.js';

// https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration
// https://www.prisma.io/docs/orm/reference/prisma-config-reference

const title = 'Prisma';

const enablers = ['prisma', /^@prisma\/.*/];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = [
  'prisma.config.{js,ts,mjs,cjs,mts,cts}',
  './config/prisma.config.{js,ts,mjs,cjs,mts,cts}',
  'package.json',
];

const resolveConfig: ResolveConfig<PrismaConfig> = async (config, options) => {
  // if config is a package.json file
  if (options.configFileName === 'package.json' && config.seed) {
    return options.getInputsFromScripts(config.seed);
  }
  if (config.migrations?.seed) {
    return options.getInputsFromScripts(config.migrations.seed);
  }
  return [];
};

const args = {
  config: true,
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  args,
  resolveConfig,
} satisfies Plugin;
