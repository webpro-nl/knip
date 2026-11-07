import type { Compiler } from '../compilers/types.ts';
import type { CyclesConfig, IgnoreExportsUsedInFile, IgnoreIssues, IgnorePatterns } from './config.ts';
import type { IssueType, Rules } from './issues.ts';
import type { PluginName } from './PluginNames.ts';

type Glob = string | string[];

export type RawPluginConfiguration =
  | boolean
  | Glob
  | { config?: Glob | undefined; entry?: Glob | undefined; project?: Glob | undefined };

type RawPluginsConfiguration = { [K in PluginName]?: RawPluginConfiguration | undefined };

export interface RawConfiguration extends RawPluginsConfiguration {
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
   *   "$schema": "https://unpkg.com/knip@6/schema.json"
   * }
   * ```
   *
   * @example
   * In JSONC, use the provided JSONC schema:
   * ```jsonc title="knip.jsonc"
   * {
   *   "$schema": "https://unpkg.com/knip@6/schema-jsonc.json"
   * }
   * ```
   *
   * @remarks
   * Use JSONC if you want to use comments and/or trailing commas.
   */
  $schema?: string | undefined;
  /**
   * @default {}
   *
   * @see {@link https://knip.dev/features/rules-and-filters | Rules & Filters}
   */
  rules?: Partial<Rules> | undefined;
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
  entry?: Glob | undefined;
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
  project?: Glob | undefined;
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
  paths?: Record<string, string[]> | undefined;
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
  ignore?: Glob | undefined;
  /**
   * Array of glob patterns of files to exclude from the "Unused files" report section only.
   *
   * Unlike `ignore`, which suppresses all issue types for matching files, `ignoreFiles` only
   * affects the `files` issue type. Use this when a file should still be analyzed for other
   * issues (exports, dependencies, unresolved) but should not be considered for unused file detection.
   */
  ignoreFiles?: Glob | undefined;
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
  ignoreBinaries?: IgnorePatterns | undefined;
  ignoreGlobalBinaries?: boolean | undefined;
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
  ignoreDependencies?: IgnorePatterns | undefined;
  /**
   * Array of enum and namespace members to exclude from the report. Regular expressions
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
  ignoreMembers?: IgnorePatterns | undefined;
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
  ignoreUnresolved?: IgnorePatterns | undefined;
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
   *
   * @remarks
   * Set this option at root level to enable this globally, or within workspace
   * configurations individually.
   */
  ignoreExportsUsedInFile?: IgnoreExportsUsedInFile | undefined;
  /**
   * Ignore specific issue types for specific file patterns. Keys are glob
   * patterns and values are arrays of issue types to ignore for matching files.
   * This allows ignoring specific issues (like unused exports) in generated
   * files while still reporting other issues in those same files.
   *
   * @remarks
   * Set this option at root level to apply globally, or within workspace
   * configurations individually. Workspace-level patterns are relative to the
   * workspace root.
   *
   * @see {@link https://knip.dev/reference/configuration#ignoreissues}
   */
  ignoreIssues?: IgnoreIssues | undefined;
  /**
   * Configure circular dependency (`cycles`) detection: allow (accept) specific
   * cycles by exact path, or include dynamic `import()` edges (excluded by default).
   *
   * @example
   * ```json title="knip.json"
   * {
   *   "cycles": {
   *     "dynamicImports": true,
   *     "allow": [["src/a.ts", "src/b.ts"]]
   *   }
   * }
   * ```
   *
   * @see {@link https://knip.dev/reference/configuration#cycles}
   */
  cycles?: CyclesConfig | undefined;
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
  ignoreWorkspaces?: string[] | undefined;
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
  includeEntryExports?: boolean | undefined;
  /**
   * Override built-in compilers or add custom compilers for additional file types.
   *
   * @see {@link https://knip.dev/features/compilers | Compilers}
   */
  compilers?: Record<string, Compiler | true> | undefined;
  /** @internal */
  asyncCompilers?: Record<string, Compiler> | undefined;
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
  tags?: string[] | undefined;
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
  treatConfigHintsAsErrors?: boolean | undefined;
  /**
   * Exit with non-zero code (1) if there are any tag hints.
   *
   * @default false
   *
   * @example
   * ```json title="knip.json"
   * {
   *   "treatTagHintsAsErrors": true
   * }
   * ```
   */
  treatTagHintsAsErrors?: boolean | undefined;
  /**
   * Preprocess the results before providing them to the reporter(s).
   * Can be a single preprocessor or an array of preprocessors.
   * Each value is a path to a local file or an npm package name.
   *
   * @default []
   *
   * @example
   * ```json title="knip.json"
   * {
   *   "preprocessor": "./my-preprocessor.ts"
   * }
   * ```
   *
   * @example
   * ```json title="knip.json"
   * {
   *   "preprocessor": ["./first.ts", "./second.ts"]
   * }
   * ```
   *
   * @see {@link https://knip.dev/features/reporters#preprocessors | Preprocessors}
   */
  preprocessor?: Glob | undefined;
  /**
   * Extra options to pass to the preprocessor.
   *
   * @default {}
   *
   * @example
   * ```json title="knip.json"
   * {
   *   "preprocessor": "./my-preprocessor.ts",
   *   "preprocessorOptions": { "key": "value" }
   * }
   * ```
   */
  preprocessorOptions?: Record<string, unknown> | undefined;

  /**
   * @default []
   *
   * @see {@link https://knip.dev/features/rules-and-filters | Rules & Filters}
   */
  include?: IssueType[] | undefined;
  /**
   * @default []
   *
   * @see {@link https://knip.dev/features/rules-and-filters | Rules & Filters}
   */
  exclude?: IssueType[] | undefined;

  workspaces?: Record<string, WorkspaceProjectConfig> | undefined;
}

export type WorkspaceProjectConfig = Pick<
  RawConfiguration,
  | 'entry'
  | 'project'
  | 'paths'
  | 'ignore'
  | 'ignoreFiles'
  | 'ignoreBinaries'
  | 'ignoreGlobalBinaries'
  | 'ignoreDependencies'
  | 'ignoreMembers'
  | 'ignoreUnresolved'
  | 'ignoreExportsUsedInFile'
  | 'ignoreIssues'
  | 'includeEntryExports'
> &
  RawPluginsConfiguration;
