import { createRequire } from 'node:module';
import internalReporters from '../reporters/index.ts';
import type { Results } from '../run.ts';
import type { ReporterOptions } from '../types/issues.ts';
import type { MainOptions } from './create-options.ts';
import { LoaderError, PreprocessorError } from './errors.ts';
import { _load } from './loader.ts';
import { logError } from './log.ts';
import { dirname, isAbsolute, isInternal, join, resolve } from './path.ts';

const resolvePreprocessor = (preprocessor: string, configFilePath: string | undefined) => {
  if (!configFilePath)
    return isInternal(preprocessor) && !isAbsolute(preprocessor) ? resolve(preprocessor) : preprocessor;
  if (isAbsolute(preprocessor)) return preprocessor;
  if (isInternal(preprocessor)) return join(dirname(configFilePath), preprocessor);
  return createRequire(configFilePath).resolve(preprocessor);
};

const loadPreprocessor = async (preprocessor: string, configFilePath: string | undefined) => {
  try {
    return await _load(resolvePreprocessor(preprocessor, configFilePath));
  } catch (error) {
    if (error instanceof LoaderError) throw error;
    throw new LoaderError(`Error loading ${preprocessor}`, { cause: error });
  }
};

const isReporterOptions = (value: unknown): value is ReporterOptions =>
  typeof value === 'object' &&
  value !== null &&
  'issues' in value &&
  typeof value.issues === 'object' &&
  value.issues !== null;

const runPreprocessors = async (
  processors: string[],
  data: ReporterOptions,
  configFilePath?: string
): Promise<ReporterOptions> => {
  if (processors.length === 0) return data;
  const [preprocessor, ...remaining] = processors;
  const loadedPreprocessor = await loadPreprocessor(preprocessor, configFilePath);
  const result: unknown = await loadedPreprocessor(data);
  if (!isReporterOptions(result))
    throw new PreprocessorError(
      `Preprocessor contract violation: expected an object with an "issues" object from ${preprocessor}`
    );
  return runPreprocessors(remaining, result, configFilePath);
};

const createReporterOptions = (results: Results, options: MainOptions): ReporterOptions => ({
  report: options.includedIssueTypes,
  issues: results.issues,
  counters: results.counters,
  tagHints: results.tagHints,
  configurationHints: results.configurationHints,
  enabledPlugins: results.enabledPlugins,
  includedWorkspaceDirs: results.includedWorkspaceDirs,
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
  selectedWorkspaces: results.selectedWorkspaces,
});

export const runPreprocessorStage = async (results: Results, options: MainOptions) => {
  const data = createReporterOptions(results, options);
  if (options.preprocessor.length === 0) return data;
  try {
    return await runPreprocessors(options.preprocessor, structuredClone(data), options.preprocessorConfigFilePath);
  } catch (error) {
    if (!options.isSession) throw error;
    logError(`Preprocessor failed: ${error instanceof Error ? error.message : String(error)}`);
    return data;
  }
};

export const runReporters = async (reporter: string[], options: ReporterOptions) => {
  const reporters = await Promise.all(
    reporter.map(async reporter => {
      return reporter in internalReporters
        ? internalReporters[reporter as keyof typeof internalReporters]
        : await _load(isInternal(reporter) && !isAbsolute(reporter) ? resolve(reporter) : reporter);
    })
  );

  for (const reporter of reporters) await reporter(options);
};
