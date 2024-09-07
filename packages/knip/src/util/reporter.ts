import internalReporters from '../reporters/index.js';
import type { ReporterOptions } from '../types/issues.js';
import { _load } from './loader.js';
import { isInternal, resolve } from './path.js';

export const runPreprocessors = async (processors: string[], data: ReporterOptions): Promise<ReporterOptions> => {
  const preprocessors = await Promise.all(processors.map(proc => _load(isInternal(proc) ? resolve(proc) : proc)));
  return preprocessors.length === 0
    ? Promise.resolve(data)
    : runPreprocessors(preprocessors.slice(1), preprocessors[0](data));
};

export const runReporters = async (reporter: string[], options: ReporterOptions) => {
  const reporters = await Promise.all(
    reporter.map(async reporter => {
      return reporter in internalReporters
        ? internalReporters[reporter as keyof typeof internalReporters]
        : await _load(isInternal(reporter) ? resolve(reporter) : reporter);
    })
  );

  for (const reporter of reporters) await reporter(options);
};
