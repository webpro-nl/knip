import { partitionCompilers } from '../compilers/index.ts';
import { KNIP_CONFIG_LOCATIONS } from '../constants.ts';
import { knipConfigurationSchema } from '../schema/configuration.ts';
import type { RawConfiguration } from '../types/config.ts';
import type { IssueType } from '../types/issues.ts';
import type { Options } from '../types/options.ts';
import type { PackageJson } from '../types/package-json.ts';
import { getCatalogContainer } from './catalog.ts';
import type { ParsedCLIArgs } from './cli-arguments.ts';
import { ConfigurationError } from './errors.ts';
import { findFile, loadJSON } from './fs.ts';
import { getIncludedIssueTypes, shorthandDeps, shorthandExports, shorthandFiles } from './get-included-issue-types.ts';
import { defaultRules } from './issue-initializers.ts';
import { loadResolvedConfigFile } from './load-config.ts';
import { _load } from './loader.ts';
import { getKeysByValue } from './object.ts';
import { isAbsolute, join, normalize, toAbsolute, toPosix } from './path.ts';
import { splitTags } from './tag.ts';

interface CreateOptions extends Partial<Options> {
  args?: ParsedCLIArgs;
}

/**
 * - Loads package.json/pnpm-workspace.yaml
 * - Loads & validates knip.json
 * - Creates options
 */
export const createOptions = async (options: CreateOptions) => {
  const { args = {} } = options;
  const pcwd = process.cwd();
  const cwd = normalize(toPosix(toAbsolute(options.cwd ?? args.directory ?? pcwd, pcwd)));

  const manifestPath = findFile(cwd, 'package.json');
  const manifest: PackageJson = manifestPath && (await loadJSON(manifestPath));

  if (!(manifestPath && manifest)) {
    throw new ConfigurationError('Unable to find package.json');
  }

  let configFilePath: string | undefined;
  for (const configPath of args.config ? [args.config] : KNIP_CONFIG_LOCATIONS) {
    const resolvedConfigFilePath = isAbsolute(configPath) ? configPath : findFile(cwd, configPath);
    if (resolvedConfigFilePath) {
      configFilePath = resolvedConfigFilePath;
      break;
    }
  }

  if (args.config && !configFilePath && !manifest.knip) {
    throw new ConfigurationError(`Unable to find ${args.config} or package.json#knip`);
  }

  const loadedConfig = Object.assign(
    {},
    manifest.knip,
    configFilePath ? await loadResolvedConfigFile(configFilePath, args) : {}
  );

  const parsedConfig: RawConfiguration = knipConfigurationSchema.parse(partitionCompilers(loadedConfig));

  if (!configFilePath && manifest.knip) configFilePath = manifestPath;

  const pnpmWorkspacePath = findFile(cwd, 'pnpm-workspace.yaml');
  const pnpmWorkspace = pnpmWorkspacePath && (await _load(pnpmWorkspacePath));

  const workspaces =
    pnpmWorkspace?.packages ??
    (manifest.workspaces
      ? Array.isArray(manifest.workspaces)
        ? manifest.workspaces
        : (manifest.workspaces.packages ?? [])
      : []);

  const isStrict = options.isStrict ?? args.strict ?? false;
  const isProduction = options.isProduction ?? args.production ?? isStrict;
  const isDebug = args.debug ?? false;
  const isTrace = Boolean(args.trace ?? args['trace-file'] ?? args['trace-export'] ?? args['trace-dependency']);

  const rules = { ...defaultRules, ...parsedConfig.rules };
  const excludesFromRules = getKeysByValue(rules, 'off');

  const includedIssueTypes = getIncludedIssueTypes({
    isProduction,
    exclude: [...excludesFromRules, ...(parsedConfig.exclude ?? [])],
    include: parsedConfig.include ?? [],
    excludeOverrides: options.excludedIssueTypes ?? args.exclude ?? [],
    includeOverrides: [
      ...(options.includedIssueTypes ?? args.include ?? []),
      ...(args.dependencies ? shorthandDeps : []),
      ...(args.exports ? shorthandExports : []),
      ...(args.files ? shorthandFiles : []),
    ],
  });

  for (const [key, value] of Object.entries(includedIssueTypes) as [IssueType, boolean][]) {
    if (!value) rules[key] = 'off';
  }

  const fixTypes = options.fixTypes ?? args['fix-type'] ?? [];
  const isFixFiles = args['allow-remove-files'] && (fixTypes.length === 0 || fixTypes.includes('files'));
  const isIncludeLibs = args['include-libs'] ?? options.isIncludeLibs ?? false;

  const isReportClassMembers = includedIssueTypes.classMembers;
  const tags = splitTags(args.tags ?? options.tags ?? parsedConfig.tags ?? args['experimental-tags'] ?? []);

  const workspace = options.workspace ?? args.workspace;

  return {
    cacheLocation: args['cache-location'] ?? join(cwd, 'node_modules', '.cache', 'knip'),
    catalog: await getCatalogContainer(cwd, manifest, manifestPath, pnpmWorkspacePath, pnpmWorkspace),
    config: args.config,
    configFilePath,
    cwd,
    dependencies: args.dependencies ?? false,
    experimentalTags: tags,
    exports: args.exports ?? false,
    files: args.files ?? false,
    fixTypes,
    gitignore: args['no-gitignore'] ? false : (options.gitignore ?? true),
    includedIssueTypes,
    isCache: args.cache ?? false,
    isDebug,
    isDisableConfigHints: args['no-config-hints'] || isProduction || Boolean(workspace),
    isFix: args.fix ?? options.isFix ?? isFixFiles ?? fixTypes.length > 0,
    isFixCatalog: fixTypes.length === 0 || fixTypes.includes('catalog'),
    isFixDependencies: fixTypes.length === 0 || fixTypes.includes('dependencies'),
    isFixFiles,
    isFixUnusedExports: fixTypes.length === 0 || fixTypes.includes('exports'),
    isFixUnusedTypes: fixTypes.length === 0 || fixTypes.includes('types'),
    isFormat: args.format ?? options.isFormat ?? false,
    isIncludeEntryExports: args['include-entry-exports'] ?? options.isIncludeEntryExports ?? false,
    isIsolateWorkspaces: options.isIsolateWorkspaces ?? args['isolate-workspaces'] ?? false,
    isProduction,
    isReportClassMembers,
    isReportDependencies:
      includedIssueTypes.dependencies ||
      includedIssueTypes.unlisted ||
      includedIssueTypes.unresolved ||
      includedIssueTypes.binaries,
    isReportExports:
      includedIssueTypes.exports ||
      includedIssueTypes.types ||
      includedIssueTypes.nsExports ||
      includedIssueTypes.nsTypes ||
      includedIssueTypes.enumMembers ||
      includedIssueTypes.duplicates ||
      isReportClassMembers,
    isReportFiles: includedIssueTypes.files,
    isReportTypes: includedIssueTypes.types || includedIssueTypes.nsTypes || includedIssueTypes.enumMembers,
    isReportValues: includedIssueTypes.exports || includedIssueTypes.nsExports || isReportClassMembers,
    isSession: options.isSession ?? false,
    isShowProgress:
      !isDebug &&
      !isTrace &&
      args['no-progress'] !== true &&
      options.isShowProgress !== false &&
      process.stdout.isTTY &&
      typeof process.stdout.cursorTo === 'function',
    isSkipLibs: !(isIncludeLibs || includedIssueTypes.classMembers),
    isStrict,
    isTrace,
    isTreatConfigHintsAsErrors: args['treat-config-hints-as-errors'] ?? parsedConfig.treatConfigHintsAsErrors ?? false,
    isUseTscFiles: options.isUseTscFiles ?? args['use-tsconfig-files'] ?? (options.isSession && !configFilePath),
    isWatch: args.watch ?? options.isWatch ?? false,
    maxShowIssues: args['max-show-issues'] ? Number(args['max-show-issues']) : undefined,
    parsedConfig,
    rules,
    tags,
    traceDependency: args['trace-dependency'],
    traceExport: args['trace-export'],
    traceFile: args['trace-file'] ? toAbsolute(args['trace-file'], cwd) : undefined,
    tsConfigFile: args.tsConfig,
    workspace,
    workspaces,
  };
};

export type MainOptions = Awaited<ReturnType<typeof createOptions>>;
