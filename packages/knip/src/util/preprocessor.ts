import type { Results } from '../run.ts';
import type { ReporterOptions } from '../types/issues.ts';
import type { MainOptions } from './create-options.ts';
import { _load } from './loader.ts';
import { isInternal, toAbsolute } from './path.ts';

export const toPreprocessorPath = (specifier: string, cwd: string) =>
  isInternal(specifier) ? toAbsolute(specifier, cwd) : specifier;

export const toReporterOptions = (options: MainOptions, results: Results): ReporterOptions => ({
  report: options.includedIssueTypes,
  issues: results.issues,
  counters: results.counters,
  tagHints: results.tagHints,
  configurationHints: results.configurationHints,
  enabledPlugins: results.enabledPlugins,
  includedWorkspaceDirs: results.includedWorkspaceDirs,
  selectedWorkspaces: results.selectedWorkspaces,
  cwd: options.cwd,
  configFilePath: options.configFilePath,
  isDisableConfigHints: options.isDisableConfigHints,
  isDisableTagHints: options.isDisableTagHints,
  isProduction: options.isProduction,
  isShowProgress: options.isShowProgress,
  isTreatConfigHintsAsErrors: options.isTreatConfigHintsAsErrors,
  isTreatTagHintsAsErrors: options.isTreatTagHintsAsErrors,
  maxShowIssues: options.maxShowIssues,
  options: options.reporterOptions,
  preprocessorOptions: options.preprocessorOptions,
});

export const runPreprocessors = async (processors: string[], data: ReporterOptions): Promise<ReporterOptions> => {
  if (processors.length === 0) return data;
  const preprocessors = await Promise.all(processors.map(proc => _load(toPreprocessorPath(proc, data.cwd))));
  let result = data;
  for (const preprocessor of preprocessors) result = await preprocessor(result);
  return result;
};
