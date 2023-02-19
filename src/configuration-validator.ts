import { z } from 'zod';

const globSchema = z.union([z.string(), z.array(z.string())]);

const pathsSchema = z.record(z.string(), z.array(z.string()));

const syncCompilerSchema = z.function().args(z.string()).returns(z.string());
const asyncCompilerSchema = z.function().args(z.string()).returns(z.promise(z.string()));
const compilerSchema = z.union([syncCompilerSchema, asyncCompilerSchema]);
const compilersSchema = z.record(z.string(), compilerSchema);

const rootConfigurationSchema = z.object({
  entry: globSchema.optional(),
  project: globSchema.optional(),
  paths: pathsSchema.optional(),
  ignore: globSchema.optional(),
  ignoreBinaries: z.array(z.string()).optional(),
  ignoreDependencies: z.array(z.string()).optional(),
  ignoreWorkspaces: z.array(z.string()).optional(),
  compilers: compilersSchema.optional(),
  syncCompilers: z.record(z.string(), syncCompilerSchema).optional(),
  asyncCompilers: z.record(z.string(), asyncCompilerSchema).optional(),
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
  'github-actions': pluginSchema,
  husky: pluginSchema,
  jest: pluginSchema,
  'lint-staged': pluginSchema,
  markdownlint: pluginSchema,
  mocha: pluginSchema,
  next: pluginSchema,
  'npm-package-json-lint': pluginSchema,
  nx: pluginSchema,
  nyc: pluginSchema,
  playwright: pluginSchema,
  postcss: pluginSchema,
  prettier: pluginSchema,
  'release-it': pluginSchema,
  remark: pluginSchema,
  remix: pluginSchema,
  rollup: pluginSchema,
  sentry: pluginSchema,
  storybook: pluginSchema,
  stryker: pluginSchema,
  typescript: pluginSchema,
  vitest: pluginSchema,
  webpack: pluginSchema,
});

const baseWorkspaceConfigurationSchema = z.object({
  entry: globSchema.optional(),
  project: globSchema.optional(),
  paths: pathsSchema.optional(),
  ignore: globSchema.optional(),
  ignoreBinaries: z.array(z.string()).optional(),
  ignoreDependencies: z.array(z.string()).optional(),
});

const workspaceConfigurationSchema = baseWorkspaceConfigurationSchema.merge(pluginsSchema.partial());

const workspacesConfigurationSchema = z.object({
  workspaces: z.record(z.string(), workspaceConfigurationSchema).optional(),
});

export const ConfigurationValidator = rootConfigurationSchema
  .merge(reportConfigSchema)
  .merge(workspacesConfigurationSchema)
  .merge(pluginsSchema.partial());
