import { z } from 'zod/mini';
import { SYMBOL_TYPE } from '../constants.js';
import { globSchema, pluginsSchema } from './plugins.js';

const pathsSchema = z.record(z.string(), z.array(z.string()));

type SyncCompiler = (filename: string, contents: string) => string;
type AsyncCompiler = (filename: string, contents: string) => Promise<string>;

const syncCompilerSchema = z.union([z.literal(true), z.custom<SyncCompiler>()]);
const asyncCompilerSchema = z.custom<AsyncCompiler>();
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
  z.literal('catalog'),
]);

const rulesSchema = z.partialRecord(issueTypeSchema, z.enum(['error', 'warn', 'off']));

const ignorableSymbolTypes = Object.values(SYMBOL_TYPE).filter(type => type !== 'unknown');

const ignoreExportsUsedInFileObjectSchema = z.strictObject(
  Object.fromEntries(ignorableSymbolTypes.map(type => [type, z.optional(z.boolean())]))
);

const ignoreExportsUsedInFileSchema = z.union([z.boolean(), ignoreExportsUsedInFileObjectSchema]);

const ignoreIssuesSchema = z.record(z.string(), z.array(issueTypeSchema));

const rootConfigurationSchema = z.object({
  /**
   * A `$schema` field is a URL that you put at the top of your JSON file. This
   * allows you to get red squiggly lines inside of your IDE when you make a typo or
   * provide an otherwise invalid configuration option.
   *
   * @default undefined
   *
   * @example
   * In JSON, use the provided JSON schema:
   *
   * ```json title="knip.json"
   * {
   *   "$schema": "https://unpkg.com/knip@5/schema.json"
   * }
   * ```
   *
   * @example
   * In JSONC, use the provided JSONC schema:
   * ```jsonc title="knip.jsonc"
   * {
   *   "$schema": "https://unpkg.com/knip@5/schema-jsonc.json"
   * }
   * ```
   *
   * @remarks
   * Use JSONC if you want to use comments and/or trailing commas.
   */
  $schema: z.optional(z.string()),
  /**
   * @default {}
   *
   * @see {@link https://knip.dev/features/rules-and-filters | Rules & Filters}
   */
  rules: z.optional(rulesSchema),
  /**
   * Array of glob patterns to find entry files. Prefix with `!` for negation.
   *
   * @example
   * ```json title="knip.json"
   * {
   *   "entry": ["src/index.ts", "scripts/*.ts", "!scripts/except-this-one.ts"]
   * }
   * ```
   *
   * @see {@link https://knip.dev/overview/configuration | configuration} and {@link https://knip.dev/explanations/entry-files | entry files}
   */
  entry: z.optional(globSchema),
  /**
   * Array of glob patterns to find project files.
   *
   * @example
   * ```json title="knip.json"
   * {
   *   "project": ["src\/**\/*.ts", "scripts\/**\/*.ts"]
   * }
   * ```
   *
   * @see {@link https://knip.dev/overview/configuration | configuration} and {@link https://knip.dev/explanations/entry-files | entry files}
   */
  project: z.optional(globSchema),
  /**
   * Tools like TypeScript, webpack and Babel support import aliases in various ways.
   * Knip automatically includes `compilerOptions.paths` from the TypeScript
   * configuration, but does not automatically use other types of import aliases.
   * They can be configured manually:
   *
   * @example
   * ```json title="knip.json"
   * {
   *   "paths": {
   *     "@lib": ["./lib/index.ts"],
   *     "@lib/*": ["./lib/*"]
   *   }
   * }
   * ```
   *
   * @remarks
   * Each workspace can have its own `paths` configured. Knip `paths` follow the
   * TypeScript semantics:
   *
   * - Path values are an array of relative paths
   * - Paths without an `*` are exact matches
   *
   */
  paths: z.optional(pathsSchema),
  /**
   * :::tip
   *
   * Please read {@link https://knip.dev/guides/configuring-project-files | project files configuration} before using the `ignore` option,
   * because in many cases you'll want to **fine-tune project files** instead.
   *
   * :::
   *
   * Array of glob patterns to ignore issues from matching files.
   *
   * @example
   * ```json title="knip.json"
   * {
   *   "ignore": ["src/generated.ts", "fixtures/**"]
   * }
   * ```
   */
  ignore: z.optional(globSchema),
  /**
   * Array of glob patterns of files to exclude from the "Unused files" report section only.
   *
   * Unlike `ignore`, which suppresses all issue types for matching files, `ignoreFiles` only
   * affects the `files` issue type. Use this when a file should still be analyzed for other
   * issues (exports, dependencies, unresolved) but should not be considered for unused file detection.
   */
  ignoreFiles: z.optional(globSchema),
  /**
   * Exclude binaries that are used but not provided by any dependency from the
   * report. Value is an array of binary names or regular expressions.
   *
   * @example
   * ```json title="knip.json"
   * {
   *   "ignoreBinaries": ["zip", "docker-compose", "pm2-.+"]
   * }
   * ```
   *
   * @example
   * Actual regular expressions can be used in dynamic configurations:
   *
   * ```ts title="knip.ts"
   * export default {
   *   ignoreBinaries: [/^pm2-.+/],
   * };
   * ```
   */
  ignoreBinaries: z.optional(stringOrRegexSchema),
  /**
   * Array of package names to exclude from the report. Regular expressions allowed.
   *
   * @example
   * ```json title="knip.json"
   * {
   *   "ignoreDependencies": ["hidden-package", "@org/.+"]
   * }
   * ```
   *
   * @example
   * Actual regular expressions can be used in dynamic configurations.
   * ```ts title="knip.ts"
   * export default {
   *   ignoreDependencies: [/@org\/.*\/, /^lib-.+/],
   * };
   * ```
   */
  ignoreDependencies: z.optional(stringOrRegexSchema),
  /**
   * Array of class and enum members to exclude from the report. Regular expressions
   * allowed.
   *
   * @example
   * ```json title="knip.json"
   * {
   *   "ignoreMembers": ["render", "on.+"]
   * }
   * ```
   *
   * Actual regular expressions can be used in dynamic configurations.
   */
  ignoreMembers: z.optional(stringOrRegexSchema),
  /**
   * Array of specifiers to exclude from the report. Regular expressions allowed.
   *
   * @example
   * ```json title="knip.json"
   * {
   *   "ignoreUnresolved": ["ignore-unresolved-import", "#virtual/.+"]
   * }
   * ```
   * @example
   * Actual regular expressions can be used in dynamic configurations:
   *
   * ```ts title="knip.ts"
   * export default {
   *   ignoreUnresolved: [/^#/.+/],
   * };
   * ```
   */
  ignoreUnresolved: z.optional(stringOrRegexSchema),
  /**
   * In files with multiple exports, some of them might be used only internally. If
   * these exports should not be reported, there is a `ignoreExportsUsedInFile`
   * option available. With this option enabled, when something is also no longer
   * used internally, it will be reported as unused.
   *
   * @default false
   *
   * @example
   * ```json title="knip.json"
   * {
   *   "ignoreExportsUsedInFile": true
   * }
   * ```
   *
   * @example
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
  ignoreExportsUsedInFile: z.optional(ignoreExportsUsedInFileSchema),
  /**
   * Ignore specific issue types for specific file patterns. Keys are glob
   * patterns and values are arrays of issue types to ignore for matching files.
   * This allows ignoring specific issues (like unused exports) in generated
   * files while still reporting other issues in those same files.
   *
   * @see {@link https://knip.dev/reference/configuration#ignoreissues}
   */
  ignoreIssues: z.optional(ignoreIssuesSchema),
  /**
   * Array of workspaces to ignore, globs allowed.
   *
   * @example
   * ```json title="knip.json"
   * {
   *   "ignoreWorkspaces": [
   *     "packages/go-server",
   *     "packages/flat/*",
   *     "packages/deep/**"
   *   ]
   * }
   * ```
   */
  ignoreWorkspaces: z.optional(z.array(z.string())),
  /**
   * By default, Knip does not report unused exports in entry files. When a
   * repository (or workspace) is self-contained or private, you may want to include
   * entry files when reporting unused exports:
   *
   * @default false
   *
   * @example
   * ```json title="knip.json"
   * {
   *   "includeEntryExports": true
   * }
   * ```
   *
   * @remarks
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
  includeEntryExports: z.optional(z.boolean()),
  /**
   * Override built-in compilers or add custom compilers for additional file types.
   *
   * @see {@link https://knip.dev/features/compilers | Compilers}
   */
  compilers: z.optional(compilersSchema),
  /** @internal */
  syncCompilers: z.optional(z.record(z.string(), syncCompilerSchema)),
  /** @internal */
  asyncCompilers: z.optional(z.record(z.string(), asyncCompilerSchema)),
  /**
   * Exports can be tagged with known or arbitrary JSDoc/TSDoc tags.
   *
   * @default []
   *
   * @example
   * ```ts
   * // \**
   * //  * Description of my exported value
   * //  *
   * //  * \@type number
   * //  * \@internal Important matters
   * //  * \@lintignore
   * //  *\/
   * export const myExport = 1;
   * ```
   *
   * And then include (`+`) or exclude (`-`) these tagged exports from the report
   * like so:
   *
   * ```json
   * {
   *   "tags": ["-lintignore"]
   * }
   * ```
   *
   * This way, you can either focus on or ignore specific tagged exports with tags
   * you define yourself. This also works for individual class or enum members.
   *
   *
   * @example
   * The default directive is `+` (include) and the `@` prefix is ignored, so the
   * notation below is valid and will report only exports tagged `@lintignore` or
   * `@internal`:
   *
   * ```json
   * {
   *   "tags": ["@lintignore", "@internal"]
   * }
   * ```
   *
   * @see {@link https://knip.dev/reference/jsdoc-tsdoc-tags | JSDoc & TSDoc Tags }
   */
  tags: z.optional(z.array(z.string())),
  /**
   * Exit with non-zero code (1) if there are any configuration hints.
   *
   * @default false
   *
   * @example
   * ```json title="knip.json"
   * {
   *   "treatConfigHintsAsErrors": true
   * }
   * ```
   */
  treatConfigHintsAsErrors: z.optional(z.boolean()),
});

const reportConfigSchema = z.object({
  /**
   * @default []
   *
   * @see {@link https://knip.dev/features/rules-and-filters | Rules & Filters}
   */
  include: z.optional(z.array(issueTypeSchema)),
  /**
   * @default []
   *
   * @see {@link https://knip.dev/features/rules-and-filters | Rules & Filters}
   */
  exclude: z.optional(z.array(issueTypeSchema)),
});

const baseWorkspaceConfigurationSchema = z.object({
  entry: z.optional(globSchema),
  project: z.optional(globSchema),
  paths: z.optional(pathsSchema),
  ignore: z.optional(globSchema),
  ignoreFiles: z.optional(globSchema),
  ignoreBinaries: z.optional(stringOrRegexSchema),
  ignoreDependencies: z.optional(stringOrRegexSchema),
  ignoreMembers: z.optional(stringOrRegexSchema),
  ignoreUnresolved: z.optional(stringOrRegexSchema),
  includeEntryExports: z.optional(z.boolean()),
});

const partialPluginsSchema = z.partial(pluginsSchema);

const workspaceConfigurationSchema = z.strictObject({
  ...baseWorkspaceConfigurationSchema.shape,
  ...partialPluginsSchema.shape,
});

const workspacesConfigurationSchema = z.object({
  workspaces: z.optional(z.record(z.string(), workspaceConfigurationSchema)),
});

export const knipConfigurationSchema = z.strictObject({
  ...rootConfigurationSchema.shape,
  ...reportConfigSchema.shape,
  ...workspacesConfigurationSchema.shape,
  ...partialPluginsSchema.shape,
});
