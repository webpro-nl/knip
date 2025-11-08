import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import type { PackageJson } from '../../types/package-json.js';
import { type Input, toEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { PrismaConfig } from './types.js';

// https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration
// https://www.prisma.io/docs/orm/reference/prisma-config-reference

const title = 'Prisma';

const enablers = ['prisma', /^@prisma\/.*/];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry: string[] = ['prisma/schema.prisma', 'schema.prisma'];

const config: string[] = [
  'prisma.config.{js,ts,mjs,cjs,mts,cts}',
  '.config/prisma.{js,ts,mjs,cjs,mts,cts}',
  'package.json',
];

function schemaFromScript(scripts: PackageJson['scripts']) {
  if (!scripts) {
    return [];
  }
  const schemas: string[] = [];
  for (const script of Object.values(scripts)) {
    const match = script.match(/prisma.+--schema\s+([^\s]+)/);
    if (match) {
      schemas.push(match[1]);
    }
  }
  return schemas;
}

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
  // https://www.prisma.io/docs/orm/prisma-schema/overview/location#prisma-schema-location
  const mergedEntry: string[] = [...entry];
  if (config.schema) {
    // package.json and Prisma config file
    mergedEntry.push(config.schema);
  }
  if (options.configFileName === 'package.json') {
    mergedEntry.push(...schemaFromScript(options.manifest.scripts));
  }
  inputs.push(...mergedEntry.map(id => toEntry(id)));

  return inputs;
};

const args = {
  config: true,
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
