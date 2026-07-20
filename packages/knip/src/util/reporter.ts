import internalReporters from '../reporters/index.ts';
import type { ReporterOptions } from '../types/issues.ts';
import { _load } from './loader.ts';
import { isAbsolute, isInternal, resolve } from './path.ts';

export const runPreprocessors = async (processors: string[], data: ReporterOptions): Promise<ReporterOptions> => {
  const preprocessors = await Promise.all(
    processors.map(proc => _load(isInternal(proc) && !isAbsolute(proc) ? resolve(proc) : proc))
  );
  let result = data;
  for (const preprocessor of preprocessors) result = await preprocessor(result);
  return result;
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
