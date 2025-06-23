/**
 * This page lists all configuration file options.
 *
 * @module Configuration
 */

import { z } from 'zod';
import { globSchema, pluginsSchema } from './plugins.js';

const pathsSchema = z.record(z.string(), z.array(z.string()));

const syncCompilerSchema = z.union([z.function().args(z.string(), z.string()).returns(z.string()), z.literal(true)]);
const asyncCompilerSchema = z.function().args(z.string(), z.string()).returns(z.promise(z.string()));
const compilerSchema = z.union([syncCompilerSchema, asyncCompilerSchema]);
const compilersSchema = z.record(z.string(), compilerSchema);

const stringOrRegexSchema = z.array(z.union([z.string(), z.instanceof(RegExp)]));

const fileTypesSchema = z.object({
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
  $schema: z.string().optional(),
});

/**
 * ### JSON and JSONC
 *
 * Knip supports a JSON or JSONC (JSON with comments) configuration file. Add the {@link FileTypes.$schema | `$schema`}
 * to the top of your JSON file to enable validation in your IDE.
 *
 * ### TypeScript
 *
 * Knip can also use {@link https://knip.dev/reference/dynamic-configuration | dynamic and typed configuration files.}
 *
 * @see {@link https://knip.dev/reference/dynamic-configuration | Dynamic Configuration}
 * @group File Types
 * @public
 */
export interface FileTypes extends z.TypeOf<typeof fileTypesSchema> {}

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

const workspacesSchema = z
  .record(
    z.string(),
    z
      .object({
        entry: globSchema.optional(),
        project: globSchema.optional(),
        paths: pathsSchema.optional(),
        ignore: globSchema.optional(),
        ignoreBinaries: stringOrRegexSchema.optional(),
        ignoreDependencies: stringOrRegexSchema.optional(),
        ignoreMembers: stringOrRegexSchema.optional(),
        ignoreUnresolved: stringOrRegexSchema.optional(),
        includeEntryExports: z.boolean().optional(),
      })
      .merge(pluginsSchema.partial())
  )
  .optional();

const projectSchema = z.object({
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
  entry: globSchema.optional(),
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
  project: globSchema.optional(),
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
  paths: pathsSchema.optional(),
});

/**
 * @group Project
 * @public
 */
export interface Project extends z.TypeOf<typeof projectSchema> {}

/**
 * Individual workspace configurations may contain all other options listed on this page, except for the following root-only options:
 *
 * - `exclude` / `include`
 * - `ignoreExportsUsedInFile`
 * - `ignoreWorkspaces`
 * - `workspaces`
 *
 * Workspaces can't be nested in a Knip configuration, but they can be nested in a
 * monorepo folder structure.
 *
 * @example
 * ```json title="knip.json"
 * {
 *   "workspaces": {
 *     "packages/frontend": {
 *       "entry": ["src/index.tsx"],
 *       "project": ["src/**\/*.{ts,tsx}"],
 *       "ignoreDependencies": ["@types/*"]
 *     },
 *     "packages/backend": {
 *       "entry": ["src/server.ts"],
 *       "project": ["src/**\/*.ts"],
 *       "jest": {
 *         "entry": ["**\/*.test.ts"]
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * @see {@link https://knip.dev/features/monorepos-and-workspaces | Monorepos and workspaces}
 * @group Workspaces
 * @public
 */
export type Workspaces = z.infer<typeof workspacesSchema>;

/**
 * There are a few options to modify the behavior of a plugin:
 *
 * - Override a plugin's `config` or `entry` location
 * - Force-enable a plugin by setting its value to `true`
 * - Disable a plugin by setting its value to `false`
 *
 *
 * @example
 * ```json title="knip.json"
 * {
 *   "mocha": {
 *     "config": "config/mocha.config.js",
 *     "entry": ["**\/*.spec.js"]
 *   },
 *   "playwright": true,
 *   "webpack": false
 * }
 * ```
 *
 * @remarks
 * It should be rarely necessary to override the `entry` patterns, since plugins
 * also read custom entry file patterns from the tooling configuration ({@link https://knip.dev/explanations/plugins#entry-files | Plugins → entry files}).
 *
 * Plugin configuration can be set on root and on a per-workspace level. If enabled
 * on root level, it can be disabled on workspace level by setting it to `false`
 * there, and vice versa.
 *
 * @see {@link https://knip.dev/explanations/plugins | Plugins}
 * @group Plugins
 * @public
 */
export type Plugins = z.infer<typeof pluginsSchema>;

const rulesSchema = z.record(issueTypeSchema, z.enum(['error', 'warn', 'off']));

const reportConfigSchema = z.object({});

const rulesAndFiltersSchema = z
  .object({
    /**
     * @default {}
     *
     * @see {@link https://knip.dev/features/rules-and-filters | Rules & Filters}
     */
    rules: rulesSchema.optional(),
    /**
     * @default []
     *
     * @see {@link https://knip.dev/features/rules-and-filters | Rules & Filters}
     */
    include: z.array(issueTypeSchema).optional(),
    /**
     * @default []
     *
     * @see {@link https://knip.dev/features/rules-and-filters | Rules & Filters}
     */
    exclude: z.array(issueTypeSchema).optional(),
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
    tags: z.array(z.string()).optional(),
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
    treatConfigHintsAsErrors: z.boolean().optional(),
  })
  .merge(reportConfigSchema);

/**
 * @group Rules & Filters
 * @public
 */
export interface RulesAndFilters extends z.TypeOf<typeof rulesAndFiltersSchema> {}

const ignoreIssuesSchema = z.object({
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
  ignore: globSchema.optional(),
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
   *
   * ```ts title="knip.ts"
   * export default {
   *   ignoreUnresolved: [/^#/.+/],
   * };
   * ```
   */
  ignoreUnresolved: stringOrRegexSchema.optional(),
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
  ignoreWorkspaces: z.array(z.string()).optional(),
});

/**
 * @group Ignore Issues
 * @public
 */
export interface IgnoreIssues extends z.TypeOf<typeof ignoreIssuesSchema> {}

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
  ignoreExportsUsedInFile: ignoreExportsUsedInFileSchema.optional(),

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
  includeEntryExports: z.boolean().optional(),
});

/**
 * @group Exports
 * @public
 */
export interface Exports extends z.TypeOf<typeof exportsSchema> {}

const compilersConfigSchema = z.object({
  /**
   * Override built-in compilers or add custom compilers for additional file types.
   * Each compiler is a function with the signature
   * `(source: string, filename: string) => string` or async equivalent.
   *
   * @example
   * ```ts title="knip.ts"
   * export default {
   *   compilers: {
   *     // Enable a built-in compiler manually
   *     mdx: true,
   *
   *     // Custom compiler for CSS files
   *     css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/g)].join('\n'),
   *
   *     // Override built-in Vue compiler
   *     vue: async (text: string, filename: string) => {
   *       // Custom Vue compilation logic
   *       return await transformVue(text);
   *     },
   *   },
   * };
   * ```
   *
   * @see {@link https://knip.dev/features/compilers | Compilers}
   */
  compilers: compilersSchema.optional(),
  /** @internal */
  syncCompilers: z.record(z.string(), syncCompilerSchema).optional(),
  /** @internal */
  asyncCompilers: z.record(z.string(), asyncCompilerSchema).optional(),
});

/**
 * Knip supports custom compilers to transform files before analysis. Knip has
 * built-in compilers for `.astro`, `.mdx`, `.svelte`, and `.vue` files that are
 * automatically enabled when the relevant dependencies are found.
 *
 * :::note
 *
 * Since compilers are functions, they can only be used in dynamic configuration
 * files (`.js` or `.ts`), not in JSON configuration files.
 *
 * :::
 *
 * @group Compilers
 * @public
 */
export interface Compilers extends z.TypeOf<typeof compilersConfigSchema> {}

/** @hidden */
export const knipConfigurationSchema = z
  .object({
    /**
     * Workspace configurations
     *
     * @see {@link Workspaces} for configuration documentation.
     * @see {@link https://knip.dev/features/monorepos-and-workspaces | Monorepos and workspaces}
     */
    workspaces: workspacesSchema,
  })
  .merge(fileTypesSchema)
  .merge(projectSchema)
  .merge(pluginsSchema.partial())
  .merge(rulesAndFiltersSchema)
  .merge(ignoreIssuesSchema)
  .merge(exportsSchema)
  .merge(compilersConfigSchema)
  .strict();
