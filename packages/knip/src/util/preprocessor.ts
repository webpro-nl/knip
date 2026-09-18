import type { Results } from '../run.ts';
import type { Preprocessor, ReporterOptions } from '../types/issues.ts';
import type { ParsedCLIArgs } from './cli-arguments.ts';
import type { MainOptions } from './create-options.ts';
import { _load } from './loader.ts';

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

export const createPreprocessor = async (processors: string[]) => {
  const preprocessors: Preprocessor[] = await Promise.all(processors.map(_load));

  return async (data: ReporterOptions) => {
    for (const preprocessor of preprocessors) data = await preprocessor(data);
    return data;
  };
};
