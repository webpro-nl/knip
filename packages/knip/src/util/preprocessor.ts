import type { Results } from '../run.ts';
import type { Issues, IssueType, Preprocessor, ReporterOptions } from '../types/issues.ts';
import type { ParsedCLIArgs } from './cli-arguments.ts';
import type { MainOptions } from './create-options.ts';
import { _load } from './loader.ts';
import { isInternal, toAbsolute } from './path.ts';

export const toPreprocessorPath = (specifier: string, cwd: string) =>
  isInternal(specifier) ? toAbsolute(specifier, cwd) : specifier;

export const toReporterOptions = (options: MainOptions, results: Results, args?: ParsedCLIArgs): ReporterOptions => ({
  ...results,
  report: options.includedIssueTypes,
  cwd: options.cwd,
  configFilePath: options.configFilePath,
  isDisableConfigHints: options.isDisableConfigHints,
  isDisableTagHints: options.isDisableTagHints,
  isProduction: options.isProduction,
  isShowProgress: options.isShowProgress,
  isTreatConfigHintsAsErrors: options.isTreatConfigHintsAsErrors,
  isTreatTagHintsAsErrors: options.isTreatTagHintsAsErrors,
  maxShowIssues: options.maxShowIssues,
  options: args?.['reporter-options'] ?? '',
  preprocessorOptions: options.preprocessorOptions,
});

// Preprocessors are documented to modify `issues` and `counters` in place, so they must not
// receive the collector's own containers: in a session that mutation would persist across refreshes
const toSnapshot = (data: ReporterOptions): ReporterOptions => {
  const issues = {} as Issues;
  for (const type in data.issues) issues[type as IssueType] = { ...data.issues[type as IssueType] };
  return { ...data, issues, counters: { ...data.counters }, tagHints: new Set(data.tagHints) };
};

export const createPreprocessor = async (processors: string[]) => {
  const preprocessors: Preprocessor[] = await Promise.all(processors.map(_load));

  return async (data: ReporterOptions) => {
    if (preprocessors.length === 0) return data;
    let result = toSnapshot(data);
    for (const preprocessor of preprocessors) result = await preprocessor(result);
    return result;
  };
};
