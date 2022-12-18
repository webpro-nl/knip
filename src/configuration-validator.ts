import { z } from 'zod';

const globSchema = z.union([z.string(), z.array(z.string())]);

const rootConfigurationSchema = z.object({
  entry: globSchema.optional(),
  project: globSchema.optional(),
  ignore: globSchema.optional(),
  ignoreBinaries: z.array(z.string()).optional(),
  ignoreDependencies: z.array(z.string()).optional(),
  ignoreWorkspaces: z.array(z.string()).optional(),
});

const reportConfigSchema = z.object({
  include: z.array(z.string()).optional(),
  exclude: z.array(z.string()).optional(),
});

const pluginSchema = z.union([
  z.literal(false),
  globSchema,
  z.object({
    config: globSchema.optional(),
    entry: globSchema.optional(),
    project: globSchema.optional(),
  }),
]);

const pluginsSchema = z.object({
  babel: pluginSchema,
  capacitor: pluginSchema,
  changesets: pluginSchema,
  commitlint: pluginSchema,
  cypress: pluginSchema,
  eslint: pluginSchema,
  gatsby: pluginSchema,
  jest: pluginSchema,
  mocha: pluginSchema,
  next: pluginSchema,
  nx: pluginSchema,
  nyc: pluginSchema,
  playwright: pluginSchema,
  postcss: pluginSchema,
  prettier: pluginSchema,
  remark: pluginSchema,
  remix: pluginSchema,
  rollup: pluginSchema,
  sentry: pluginSchema,
  storybook: pluginSchema,
  stryker: pluginSchema,
  typescript: pluginSchema,
  webpack: pluginSchema,
});

const baseWorkspaceConfigurationSchema = z.object({
  entry: globSchema.optional(),
  project: globSchema.optional(),
  ignore: globSchema.optional(),
});

const workspaceConfigurationSchema = baseWorkspaceConfigurationSchema.merge(pluginsSchema.partial());

const workspacesConfigurationSchema = z.object({
  workspaces: z.record(z.string(), workspaceConfigurationSchema).optional(),
});

export const ConfigurationValidator = rootConfigurationSchema
  .merge(reportConfigSchema)
  .merge(workspacesConfigurationSchema)
  .merge(pluginsSchema.partial());
