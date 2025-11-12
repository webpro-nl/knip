import type { ParsedArgs } from 'minimist';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { type Input, toEntry } from '../../util/input.js';
import { extname, join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import type { PrismaConfig } from './types.js';

// https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration
// https://www.prisma.io/docs/orm/reference/prisma-config-reference
// https://www.prisma.io/docs/orm/prisma-schema/overview/location#prisma-schema-location

const title = 'Prisma';

const enablers = ['prisma', /^@prisma\/.*/];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry: string[] = ['prisma/schema.prisma', 'schema.prisma'];

const config: string[] = [
  'prisma.config.{js,ts,mjs,cjs,mts,cts}',
  '.config/prisma.{js,ts,mjs,cjs,mts,cts}',
  'package.json',
];

const resolveSchema = (path: string) => {
  // `cwd` is not available in resolveInputs, so we just use extension instead
  // of isDirectory to determine if it's a file or directory.
  if (extname(path) === '.prisma') {
    return toEntry(path);
  }
  // Multi-file schema directory
  return toEntry(join(path, '**/*.prisma'));
};

const resolveConfig: ResolveConfig<PrismaConfig> = async (config, options) => {
  const inputs: Input[] = [];

  // Binary
  if (config.seed) {
    // package.json
    inputs.push(...options.getInputsFromScripts(config.seed));
  } else if (config.migrations?.seed) {
    // Prisma config file
    inputs.push(...options.getInputsFromScripts(config.migrations.seed));
  }

  // Entry/Schema
  if (config.schema) {
    // package.json and Prisma config file
    inputs.push(resolveSchema(config.schema));
  }

  return inputs;
};

const args = {
  config: true,
  resolveInputs: (parsed: ParsedArgs) => {
    const inputs: Input[] = [];
    if (parsed['schema']) {
      inputs.push(resolveSchema(parsed['schema']));
    }
    return inputs;
  },
};

export default {
  title,
  enablers,
  isEnabled,
  entry,
  config,
  args,
  resolveConfig,
} satisfies Plugin;
