import { mkdir, writeFile } from 'node:fs/promises';
import { stripVTControlCharacters } from 'node:util';
import internalReporters from '../reporters/index.ts';
import type { Reporter, ReporterOptions } from '../types/issues.ts';
import { ConfigurationError } from './errors.ts';
import { _load } from './loader.ts';
import { dirname, isAbsolute, isInternal, resolve } from './path.ts';

export const writeStdout = (output: string) => {
  if (!output) return;
  // See: https://github.com/nodejs/node/issues/6379
  // @ts-expect-error _handle is private
  process.stdout._handle?.setBlocking?.(true);
  process.stdout.write(`${output}\n`);
};

const getOutputFiles = (reporters: string[], outputFiles: string[], cwd: string) => {
  const targets = new Map<string, string>();
  for (const outputFile of outputFiles) {
    const index = outputFile.indexOf('=');
    const name = index === -1 ? reporters[0] : outputFile.slice(0, index);
    const filePath = index === -1 ? outputFile : outputFile.slice(index + 1);
    if (index === -1 && reporters.length > 1) {
      throw new ConfigurationError(
        `Option --output-file needs a reporter prefix when using multiple reporters (${reporters.join(', ')}), e.g. --output-file ${reporters[0]}=${outputFile}`
      );
    }
    if (!reporters.includes(name)) {
      throw new ConfigurationError(
        `Option --output-file refers to reporter "${name}", but it is not selected with --reporter`
      );
    }
    targets.set(name, resolve(cwd, filePath));
  }
  return targets;
};

const loadReporter = (reporter: string): Promise<Reporter> =>
  reporter in internalReporters
    ? Promise.resolve(internalReporters[reporter as keyof typeof internalReporters])
    : _load(isInternal(reporter) && !isAbsolute(reporter) ? resolve(reporter) : reporter);

export const runReporters = async (reporter: string[], outputFiles: string[], options: ReporterOptions) => {
  const targets = getOutputFiles(reporter, outputFiles, options.cwd);
  const reporters = await Promise.all(reporter.map(loadReporter));

  for (let i = 0; i < reporters.length; i++) {
    const target = targets.get(reporter[i]);
    if (!target) {
      await reporters[i]({ ...options, write: writeStdout });
      continue;
    }
    const lines: string[] = [];
    await reporters[i]({ ...options, write: output => lines.push(output) });
    if (lines.length === 0) continue;
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, `${stripVTControlCharacters(lines.join('\n'))}\n`);
  }
};
