import { z } from 'zod';
import { globSchema, pluginsSchema } from './plugins.js';

const pathsSchema = z.record(z.string(), z.array(z.string()));

const syncCompilerSchema = z.function().args(z.string(), z.string()).returns(z.string());
const asyncCompilerSchema = z.function().args(z.string(), z.string()).returns(z.promise(z.string()));
const compilerSchema = z.union([syncCompilerSchema, asyncCompilerSchema]);
const compilersSchema = z.record(z.string(), compilerSchema);

const stringOrRegexSchema = z.array(z.union([z.string(), z.instanceof(RegExp)]));

const issueTypeSchema = z.union([
  z.literal('files'),
  z.literal('dependencies'),
  z.literal('devDependencies'),
  z.literal('optionalPeerDependencies'),
  z.literal('unlisted'),
  z.literal('binaries'),
  z.literal('unresolved'),
  z.literal('exports'),
  z.literal('types'),
  z.literal('nsExports'),
  z.literal('nsTypes'),
  z.literal('duplicates'),
  z.literal('enumMembers'),
  z.literal('classMembers'),
]);

const rulesSchema = z.record(issueTypeSchema, z.enum(['error', 'warn', 'off']));

const ignoreExportsUsedInFileSchema = z.union([
  z.boolean(),
  z.record(
    z.union([
      z.literal('class'),
      z.literal('enum'),
      z.literal('function'),
      z.literal('interface'),
      z.literal('member'),
      z.literal('type'),
    ]),
    z.boolean()
  ),
]);

const rootConfigurationSchema = z.object({
  rules: rulesSchema.optional(),
  entry: globSchema.optional(),
  project: globSchema.optional(),
  paths: pathsSchema.optional(),
  ignore: globSchema.optional(),
  ignoreBinaries: stringOrRegexSchema.optional(),
  ignoreDependencies: stringOrRegexSchema.optional(),
  ignoreMembers: stringOrRegexSchema.optional(),
  ignoreUnresolved: stringOrRegexSchema.optional(),
  ignoreExportsUsedInFile: ignoreExportsUsedInFileSchema.optional(),
  ignoreWorkspaces: z.array(z.string()).optional(),
  includeEntryExports: z.boolean().optional(),
  compilers: compilersSchema.optional(),
  syncCompilers: z.record(z.string(), syncCompilerSchema).optional(),
  asyncCompilers: z.record(z.string(), asyncCompilerSchema).optional(),
});

const reportConfigSchema = z.object({
  include: z.array(issueTypeSchema).optional(),
  exclude: z.array(issueTypeSchema).optional(),
});

const baseWorkspaceConfigurationSchema = z.object({
  entry: globSchema.optional(),
  project: globSchema.optional(),
  paths: pathsSchema.optional(),
  ignore: globSchema.optional(),
  ignoreBinaries: stringOrRegexSchema.optional(),
  ignoreDependencies: stringOrRegexSchema.optional(),
  ignoreMembers: stringOrRegexSchema.optional(),
  ignoreUnresolved: stringOrRegexSchema.optional(),
  includeEntryExports: z.boolean().optional(),
});

const workspaceConfigurationSchema = baseWorkspaceConfigurationSchema.merge(pluginsSchema.partial());

const workspacesConfigurationSchema = z.object({
  workspaces: z.record(z.string(), workspaceConfigurationSchema).optional(),
});

export const knipConfigurationSchema = rootConfigurationSchema
  .merge(reportConfigSchema)
  .merge(workspacesConfigurationSchema)
  .merge(pluginsSchema.partial());
