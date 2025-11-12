import type { ParsedArgs } from 'minimist';
import type { Args } from '../../types/args.js';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { isDirectory } from '../../util/fs.js';
import { type Input, toEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
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

const resolveSchema = (path: string, cwd: string) => {
  if (!isDirectory(join(cwd, path))) {
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
    inputs.push(resolveSchema(config.schema, options.cwd));
  }

  return inputs;
};

const args: Args = {
  config: true,
  resolveInputs: (parsed: ParsedArgs, { cwd }) => {
    const inputs: Input[] = [];
    if (parsed['schema']) {
      inputs.push(resolveSchema(parsed['schema'], cwd));
    }
    return inputs;
  },
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
  config,
  args,
  resolveConfig,
};

export default plugin;
