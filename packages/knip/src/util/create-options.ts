import { partitionCompilers } from '../compilers/index.js';
import { KNIP_CONFIG_LOCATIONS } from '../constants.js';
import { knipConfigurationSchema } from '../schema/configuration.js';
import type { RawConfiguration } from '../types/config.js';
import type { IssueType } from '../types/issues.js';
import type { Options } from '../types/options.js';
import type { PackageJson } from '../types/package-json.js';
import { getCatalogContainer } from './catalog.js';
import type { ParsedCLIArgs } from './cli-arguments.js';
import { ConfigurationError } from './errors.js';
import { findFile, loadJSON } from './fs.js';
import { getIncludedIssueTypes, shorthandDeps, shorthandExports, shorthandFiles } from './get-included-issue-types.js';
import { defaultRules } from './issue-initializers.js';
import { loadResolvedConfigFile } from './load-config.js';
import { _load } from './loader.js';
import { getKeysByValue } from './object.js';
import { isAbsolute, join, normalize, toAbsolute, toPosix } from './path.js';
import { splitTags } from './tag.js';

interface CreateOptions extends Partial<Options> {
  parsedCLIArgs?: ParsedCLIArgs;
}

const pcwd = process.cwd();

/**
 * - Loads package.json/pnpm-workspace.yaml
 * - Loads & validates knip.json
 * - Creates options
 */
export const createOptions = async (options: CreateOptions) => {
  const { parsedCLIArgs = {} } = options;
  const cwd = normalize(toPosix(toAbsolute(options.cwd ?? parsedCLIArgs.directory ?? pcwd, pcwd)));

  const manifestPath = findFile(cwd, 'package.json');
  const manifest: PackageJson = manifestPath && (await loadJSON(manifestPath));

  if (!(manifestPath && manifest)) {
    throw new ConfigurationError('Unable to find package.json');
  }

  let configFilePath: string | undefined;
  for (const configPath of parsedCLIArgs.config ? [parsedCLIArgs.config] : KNIP_CONFIG_LOCATIONS) {
    const resolvedConfigFilePath = isAbsolute(configPath) ? configPath : findFile(cwd, configPath);
    if (resolvedConfigFilePath) {
      configFilePath = resolvedConfigFilePath;
      break;
    }
  }

  if (parsedCLIArgs.config && !configFilePath && !manifest.knip) {
    throw new ConfigurationError(`Unable to find ${parsedCLIArgs.config} or package.json#knip`);
  }

  const loadedConfig = Object.assign(
    {},
    manifest.knip,
    configFilePath ? await loadResolvedConfigFile(configFilePath, parsedCLIArgs) : {}
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

  const isStrict = options.isStrict ?? parsedCLIArgs.strict ?? false;
  const isProduction = options.isProduction ?? parsedCLIArgs.production ?? isStrict;
  const isDebug = parsedCLIArgs.debug ?? false;
  const isTrace = Boolean(parsedCLIArgs.trace ?? parsedCLIArgs['trace-file'] ?? parsedCLIArgs['trace-export']);

  const rules = { ...defaultRules, ...parsedConfig.rules };
  const excludesFromRules = getKeysByValue(rules, 'off');

  const includedIssueTypes = getIncludedIssueTypes({
    isProduction,
    exclude: [...excludesFromRules, ...(parsedConfig.exclude ?? [])],
    include: parsedConfig.include ?? [],
    excludeOverrides: options.excludedIssueTypes ?? parsedCLIArgs.exclude ?? [],
    includeOverrides: [
      ...(options.includedIssueTypes ?? parsedCLIArgs.include ?? []),
      ...(parsedCLIArgs.dependencies ? shorthandDeps : []),
      ...(parsedCLIArgs.exports ? shorthandExports : []),
      ...(parsedCLIArgs.files ? shorthandFiles : []),
    ],
  });

  for (const [key, value] of Object.entries(includedIssueTypes) as [IssueType, boolean][]) {
    if (!value) rules[key] = 'off';
  }

  const fixTypes = options.fixTypes ?? parsedCLIArgs['fix-type'] ?? [];
  const isFixFiles = parsedCLIArgs['allow-remove-files'] && (fixTypes.length === 0 || fixTypes.includes('files'));
  const isIncludeLibs = parsedCLIArgs['include-libs'] ?? options.isIncludeLibs ?? false;

  const isReportClassMembers = includedIssueTypes.classMembers;
  const tags = splitTags(
    parsedCLIArgs.tags ?? options.tags ?? parsedConfig.tags ?? parsedCLIArgs['experimental-tags'] ?? []
  );

  return {
    cacheLocation: parsedCLIArgs['cache-location'] ?? join(cwd, 'node_modules', '.cache', 'knip'),
    catalog: await getCatalogContainer(cwd, manifest, manifestPath, pnpmWorkspacePath, pnpmWorkspace),
    config: parsedCLIArgs.config,
    configFilePath,
    cwd,
    dependencies: parsedCLIArgs.dependencies ?? false,
    experimentalTags: tags,
    exports: parsedCLIArgs.exports ?? false,
    files: parsedCLIArgs.files ?? false,
    fixTypes,
    gitignore: parsedCLIArgs['no-gitignore'] ? false : (options.gitignore ?? true),
    includedIssueTypes,
    isCache: parsedCLIArgs.cache ?? false,
    isDebug,
    isDisableConfigHints: parsedCLIArgs['no-config-hints'] || isProduction || Boolean(parsedCLIArgs.workspace),
    isFix: parsedCLIArgs.fix ?? options.isFix ?? isFixFiles ?? fixTypes.length > 0,
    isFixCatalog: fixTypes.length === 0 || fixTypes.includes('catalog'),
    isFixDependencies: fixTypes.length === 0 || fixTypes.includes('dependencies'),
    isFixFiles,
    isFixUnusedExports: fixTypes.length === 0 || fixTypes.includes('exports'),
    isFixUnusedTypes: fixTypes.length === 0 || fixTypes.includes('types'),
    isFormat: parsedCLIArgs.format ?? options.isFormat ?? false,
    isIncludeEntryExports: parsedCLIArgs['include-entry-exports'] ?? options.isIncludeEntryExports ?? false,
    isIsolateWorkspaces: options.isIsolateWorkspaces ?? parsedCLIArgs['isolate-workspaces'] ?? false,
    isProduction,
    isReportClassMembers,
    isReportDependencies:
      includedIssueTypes.dependencies ||
      includedIssueTypes.unlisted ||
      includedIssueTypes.unresolved ||
      includedIssueTypes.binaries,
    isReportTypes: includedIssueTypes.types || includedIssueTypes.nsTypes || includedIssueTypes.enumMembers,
    isReportValues: includedIssueTypes.exports || includedIssueTypes.nsExports || isReportClassMembers,
    isSession: options.isSession ?? false,
    isShowProgress:
      !isDebug &&
      !isTrace &&
      parsedCLIArgs['no-progress'] !== true &&
      options.isShowProgress !== false &&
      process.stdout.isTTY &&
      typeof process.stdout.cursorTo === 'function',
    isSkipLibs: !(isIncludeLibs || includedIssueTypes.classMembers),
    isStrict,
    isTrace,
    isTreatConfigHintsAsErrors:
      parsedCLIArgs['treat-config-hints-as-errors'] ?? parsedConfig.treatConfigHintsAsErrors ?? false,
    isWatch: parsedCLIArgs.watch ?? options.isWatch ?? false,
    maxShowIssues: parsedCLIArgs['max-show-issues'] ? Number(parsedCLIArgs['max-show-issues']) : undefined,
    parsedConfig,
    rules,
    tags,
    traceExport: parsedCLIArgs['trace-export'],
    traceFile: parsedCLIArgs['trace-file'] ? toAbsolute(parsedCLIArgs['trace-file'], cwd) : undefined,
    tsConfigFile: parsedCLIArgs.tsConfig,
    workspace: options.workspace ?? parsedCLIArgs.workspace,
    workspaces,
  };
};

export type MainOptions = Awaited<ReturnType<typeof createOptions>>;
