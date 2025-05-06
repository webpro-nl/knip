import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';

// https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration

const title = 'Prisma';

const enablers = ['prisma', /^@prisma\/.*/];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['prisma.config.ts'];

const args = {
  binaries: ['prisma'],
  config: true,
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  args,
} satisfies Plugin;
