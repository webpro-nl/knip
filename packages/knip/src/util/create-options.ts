import { partitionCompilers } from '../compilers/index.js';
import { KNIP_CONFIG_LOCATIONS } from '../constants.js';
import { knipConfigurationSchema } from '../schema/configuration.js';
import type { RawConfiguration } from '../types/config.js';
import type { Options } from '../types/options.js';
import type { ParsedCLIArgs } from './cli-arguments.js';
import { ConfigurationError } from './errors.js';
import { findFile, loadJSON } from './fs.js';
import { getIncludedIssueTypes, shorthandDeps, shorthandFiles, shorthandTypes } from './get-included-issue-types.js';
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
  const { parsedCLIArgs = {}, ...rest } = options;
  const cwd = normalize(toPosix(toAbsolute(options.cwd ?? parsedCLIArgs.directory ?? pcwd, pcwd)));

  const manifestPath = findFile(cwd, 'package.json');
  const manifest = manifestPath && (await loadJSON(manifestPath));

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

  const pnpmWorkspacesPath = findFile(cwd, 'pnpm-workspace.yaml');
  const pnpmWorkspaces = pnpmWorkspacesPath && (await _load(pnpmWorkspacesPath));

  const workspaces =
    pnpmWorkspaces?.packages ??
    (manifest.workspaces
      ? Array.isArray(manifest.workspaces)
        ? manifest.workspaces
        : (manifest.workspaces.packages ?? [])
      : []);

  const isStrict = rest.isStrict ?? parsedCLIArgs.strict ?? false;
  const isProduction = rest.isProduction ?? parsedCLIArgs.production ?? isStrict;

  const rules = { ...defaultRules, ...parsedConfig.rules };
  const excludesFromRules = getKeysByValue(rules, 'off');

  const includedIssueTypes = getIncludedIssueTypes({
    isProduction,
    exclude: [...excludesFromRules, ...(parsedConfig.exclude ?? [])],
    include: parsedConfig.include ?? [],
    excludeOverrides: rest.excludedIssueTypes ?? parsedCLIArgs.exclude ?? [],
    includeOverrides: [
      ...(rest.includedIssueTypes ?? parsedCLIArgs.include ?? []),
      ...(parsedCLIArgs.dependencies ? shorthandDeps : []),
      ...(parsedCLIArgs.exports ? shorthandTypes : []),
      ...(parsedCLIArgs.files ? shorthandFiles : []),
    ],
  });

  const fixTypes = rest.fixTypes ?? parsedCLIArgs['fix-type'] ?? [];
  const isFixFiles = parsedCLIArgs['allow-remove-files'] && (fixTypes.length === 0 || fixTypes.includes('files'));
  const isIncludeLibs = parsedCLIArgs['include-libs'] ?? rest.isIncludeLibs ?? false;

  const isReportClassMembers = includedIssueTypes.classMembers;
  const tags = splitTags(
    parsedCLIArgs.tags ?? rest.tags ?? parsedConfig.tags ?? parsedCLIArgs['experimental-tags'] ?? []
  );

  return {
    cacheLocation: parsedCLIArgs['cache-location'] ?? join(cwd, 'node_modules', '.cache', 'knip'),
    config: parsedCLIArgs.config,
    configFilePath,
    cwd,
    dependencies: parsedCLIArgs.dependencies ?? false,
    experimentalTags: tags,
    exports: parsedCLIArgs.exports ?? false,
    files: parsedCLIArgs.files ?? false,
    fixTypes,
    gitignore: parsedCLIArgs['no-gitignore'] ? false : (rest.gitignore ?? true),
    includedIssueTypes,
    isCache: parsedCLIArgs.cache ?? false,
    isDebug: parsedCLIArgs.debug ?? false,
    isDisableConfigHints: parsedCLIArgs['no-config-hints'] || isProduction || Boolean(parsedCLIArgs.workspace),
    isFix: parsedCLIArgs.fix ?? rest.isFix ?? false,
    isFixDependencies: fixTypes.length === 0 || fixTypes.includes('dependencies'),
    isFixFiles,
    isFixUnusedExports: fixTypes.length === 0 || fixTypes.includes('exports'),
    isFixUnusedTypes: fixTypes.length === 0 || fixTypes.includes('types'),
    isFormat: parsedCLIArgs.format ?? rest.isFormat ?? false,
    isIncludeEntryExports: parsedCLIArgs['include-entry-exports'] ?? rest.isIncludeEntryExports ?? false,
    isIsolateWorkspaces: rest.isIsolateWorkspaces ?? parsedCLIArgs['isolate-workspaces'] ?? false,
    isProduction,
    isReportClassMembers,
    isReportDependencies:
      includedIssueTypes.dependencies ||
      includedIssueTypes.unlisted ||
      includedIssueTypes.unresolved ||
      includedIssueTypes.binaries,
    isReportTypes: includedIssueTypes.types || includedIssueTypes.nsTypes || includedIssueTypes.enumMembers,
    isReportValues: includedIssueTypes.exports || includedIssueTypes.nsExports || isReportClassMembers,
    isShowProgress:
      parsedCLIArgs['no-progress'] !== true && process.stdout.isTTY && typeof process.stdout.cursorTo === 'function',
    isSkipLibs: !(isIncludeLibs || includedIssueTypes.classMembers),
    isStrict,
    isTrace: Boolean(parsedCLIArgs.trace ?? parsedCLIArgs['trace-file'] ?? parsedCLIArgs['trace-export']),
    isTreatConfigHintsAsErrors:
      parsedCLIArgs['treat-config-hints-as-errors'] ?? parsedConfig.treatConfigHintsAsErrors ?? false,
    isWatch: parsedCLIArgs.watch ?? rest.isWatch ?? false,
    parsedConfig,
    rules,
    tags,
    traceExport: parsedCLIArgs['trace-export'],
    traceFile: parsedCLIArgs['trace-file'],
    tsConfigFile: parsedCLIArgs.tsConfig,
    workspace: rest.workspace ?? parsedCLIArgs.workspace,
    workspaces,
  };
};

export type MainOptions = Awaited<ReturnType<typeof createOptions>>;
