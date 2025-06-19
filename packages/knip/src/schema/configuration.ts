import { z } from 'zod';
import { globSchema, pluginsSchema } from './plugins.js';

const pathsSchema = z.record(z.string(), z.array(z.string()));

const syncCompilerSchema = z.union([z.function().args(z.string(), z.string()).returns(z.string()), z.literal(true)]);
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

export const exportsSchema = z.object({
  /**
   * In files with multiple exports, some of them might be used only internally. If
   * these exports should not be reported, there is a `ignoreExportsUsedInFile`
   * option available. With this option enabled, when something is also no longer
   * used internally, it will be reported as unused.
   *
   * ```json title="knip.json"
   * {
   *   "ignoreExportsUsedInFile": true
   * }
   * ```
   *
   * In a more fine-grained manner, to ignore only specific issue types:
   *
   * ```json title="knip.json"
   * {
   *   "ignoreExportsUsedInFile": {
   *     "interface": true,
   *     "type": true
   *   }
   * }
   * ```
   */
  ignoreExportsUsedInFile: ignoreExportsUsedInFileSchema.optional(),

  /**
   * By default, Knip does not report unused exports in entry files. When a
   * repository (or workspace) is self-contained or private, you may want to include
   * entry files when reporting unused exports:
   *
   * ```json title="knip.json"
   * {
   *   "includeEntryExports": true
   * }
   * ```
   *
   * If enabled, Knip will report unused exports in entry source files. But not in
   * entry and configuration files as configured by plugins, such as `next.config.js`
   * or `src/routes/+page.svelte`.
   *
   * This will also enable reporting unused members of exported classes and enums.
   *
   * Set this option at root level to enable this globally, or within workspace
   * configurations individually.
   *
   */
  includeEntryExports: z.boolean().optional(),
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

const projectSchema = z
  .object({
    entry: globSchema.optional(),
    project: globSchema.optional(),
    paths: pathsSchema.optional(),
    workspaces: z.record(z.string(), baseWorkspaceConfigurationSchema.merge(pluginsSchema.partial())).optional(),
  })
  .merge(pluginsSchema.partial());

const reportConfigSchema = z.object({
  include: z.array(issueTypeSchema).optional(),
  exclude: z.array(issueTypeSchema).optional(),
});

const rulesAndFiltersSchema = z
  .object({
    rules: rulesSchema.optional(),
    tags: z.array(z.string()).optional(),
  })
  .merge(reportConfigSchema);

const ignoreIssuesSchema = z.object({
  ignore: globSchema.optional(),
  ignoreBinaries: stringOrRegexSchema.optional(),
  ignoreDependencies: stringOrRegexSchema.optional(),
  ignoreMembers: stringOrRegexSchema.optional(),
  ignoreUnresolved: stringOrRegexSchema.optional(),
  ignoreWorkspaces: z.array(z.string()).optional(),
});

const fileTypesSchema = z.object({
  $schema: z.string().optional(),
});

const undocumentedSchema = z.object({
  compilers: compilersSchema.optional(),
  syncCompilers: z.record(z.string(), syncCompilerSchema).optional(),
  asyncCompilers: z.record(z.string(), asyncCompilerSchema).optional(),
  treatConfigHintsAsErrors: z.boolean().optional(),
});

export const knipConfigurationSchema = fileTypesSchema
  .merge(projectSchema)
  .merge(rulesAndFiltersSchema)
  .merge(ignoreIssuesSchema)
  .merge(exportsSchema)
  .merge(undocumentedSchema)
  .strict();
