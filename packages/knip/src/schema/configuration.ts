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

const exportsSchema = z.object({
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

const projectSchema = z.object({
  /**
   * Array of glob patterns to find entry files. Prefix with `!` for negation.
   *
   * @example
   * ```json
   * {
   *   "entry": ["src/index.ts", "scripts/*.ts", "!scripts/except-this-one.ts"]
   * }
   * ```
   *
   * @see {@link https://knip.dev/guides/configuration | configuration} and {@link https://knip.dev/guides/entry-files | entry files}
   */
  entry: globSchema.optional(),
  /**
   * Array of glob patterns to find project files.
   *
   * @example
   * ```json
   * {
   *     "project": ["src\/**\/*.ts", "scripts\/**\/*.ts"]
   * }
   * ```
   *
   * @see {@link https://knip.dev/guides/configuration | configuration} and {@link https://knip.dev/guides/entry-files | entry files}
   */
  project: globSchema.optional(),
  /**
   * Tools like TypeScript, webpack and Babel support import aliases in various ways. Knip automatically
   * includes `compilerOptions.paths` from the TypeScript configuration, but does not automatically use other
   * types of import aliases. They can be configured manually:
   *
   * @example
   * ```json
   * {
   *   "paths": {
   *     "@lib": ["./lib/index.ts"],
   *     "@lib/*": ["./lib/*"]
   *   }
   * }
   * ```
   *
   * @remarks
   * Each workspace can have its own `paths` configured. Knip paths follow the TypeScript semantics:
   * - Path values are an array of relative paths
   * - Paths without an `*` are exact matches
   *
   */
  paths: pathsSchema.optional(),
  /**
   * Individual workspace configurations may contain all other options listed on this
   * page, except for the following root-only options:
   *
   * - `exclude` / `include`
   * - `ignoreExportsUsedInFile`
   * - `ignoreWorkspaces`
   * - `workspaces`
   *
   * Workspaces can't be nested in a Knip configuration, but they can be nested in a
   * monorepo folder structure.
   *
   * @see {@link https://knip.dev/guides/monorepos-and-workspaces | Monorepos and workspaces}
   */
  workspaces: z.record(z.string(), baseWorkspaceConfigurationSchema.merge(pluginsSchema.partial())).optional(),
});

const reportConfigSchema = z.object({
  /**
   * @see {@link https://knip.dev/features/rules-and-filters | Rules & Filters}
   */
  include: z.array(issueTypeSchema).optional(),
  /**
   * @see {@link https://knip.dev/features/rules-and-filters | Rules & Filters}
   */
  exclude: z.array(issueTypeSchema).optional(),
});

const rulesAndFiltersSchema = z
  .object({
    /**
     * @see {@link https://knip.dev/features/rules-and-filters | Rules & Filters}
     */
    rules: rulesSchema.optional(),
    /**
     * Exports can be tagged with known or arbitrary JSDoc/TSDoc tags.
     *
     * @example
     * ```js
     * // \**
     * //  * Description of my exported value
     * //  *
     * //  * \@type number
     * //  * \@internal Important matters
     * //  * \@lintignore
     * //  *\/
     * export const myExport = 1;
     * ```
     * And then include (+) or exclude (-) these tagged exports from the report like so:
     *
     * ```json
     * {
     * "tags": ["-lintignore"]
     * }
     * ```
     *
     * This way, you can either focus on or ignore specific tagged exports with tags you define yourself. This also works for individual class or enum members.
     *
     *
     * @example
     * The default directive is `+` (include) and the `@` prefix is ignored.
     * This also works for individual class or enum members.
     * ```json
     * {
     *   "tags": ["-lintignore", "@internal"]
     * }
     * ```
     *
     * @see {@link https://knip.dev/reference/jsdoc-tsdoc-tags | JSDoc & TSDoc Tags }
     */
    tags: z.array(z.string()).optional(),
    /**
     * Exit with non-zero code (1) if there are any configuration hints.
     *
     * @example
     * ```json title="knip.json"
     * {
     *  "treatConfigHintsAsErrors": true
     * }
     * ```
     */
    treatConfigHintsAsErrors: z.boolean().optional(),
  })
  .merge(reportConfigSchema);

const ignoreIssuesSchema = z.object({
  /**
   * Array of glob patterns to ignore issues from matching files.
   *
   * @remarks
   * Please read {@link https://knip.dev/guides/configuring-project-files | project files configuration} before using the `ignore` option,
   * because in many cases you'll want to **fine-tune project files** instead.
   *
   * @example
   * ```json title="knip.json"
   * {
   *   "ignore": ["src/generated.ts", "fixtures/**"]
   * }
   * ```
   */
  ignore: globSchema.optional(),
  /**
   * Exclude binaries that are used but not provided by any dependency from the report.
   *
   * Value is an array of binary names or regular expressions.
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
   * ```ts title="knip.ts"
   * export default {
   *   ignoreBinaries: [/^pm2-.+/],
   * };
   * ```
   */
  ignoreBinaries: stringOrRegexSchema.optional(),
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
  ignoreDependencies: stringOrRegexSchema.optional(),
  /**
   * Array of class and enum members to exclude from the report. Regular expressions allowed.
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
  ignoreMembers: stringOrRegexSchema.optional(),
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
   * ```ts title="knip.ts"
   * export default {
   *  ignoreUnresolved: [/^#/.+/],
   * }:
   * ```
   */
  ignoreUnresolved: stringOrRegexSchema.optional(),
  /**
   * Array of workspaces to ignore. Globs allowed.
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
  ignoreWorkspaces: z.array(z.string()).optional(),
});

const fileTypesSchema = z.object({
  /**
   * A $schema field is a URL that you put at the top of your JSON file. This allows you to get red squiggly lines
   * inside of your IDE when you make a typo or provide an otherwise invalid configuration option.
   *
   * @example
   * In JSON, use the provided JSON schema:
   * ```json title="knip.json"
   * {
   *  "$schema": "https://unpkg.com/knip@5/schema.json"
   * }
   * ```
   *
   * @example
   * In JSONC, use the provided JSONC schema:
   * ```jsonc title="knip.jsonc"
   * {
   * "$schema": "https://unpkg.com/knip@5/schema-jsonc.json
   * }
   * ```
   *
   * @remarks
   * Use JSONC if you want to use comments and/or trailing commas.
   *
   */
  $schema: z.string().optional(),
});

const compilersConfigSchema = z.object({
  compilers: compilersSchema.optional(),
  syncCompilers: z.record(z.string(), syncCompilerSchema).optional(),
  asyncCompilers: z.record(z.string(), asyncCompilerSchema).optional(),
});

export const knipConfigurationSchema = fileTypesSchema
  .merge(projectSchema)
  .merge(pluginsSchema.partial())
  .merge(rulesAndFiltersSchema)
  .merge(ignoreIssuesSchema)
  .merge(exportsSchema)
  .merge(compilersConfigSchema)
  .strict();
