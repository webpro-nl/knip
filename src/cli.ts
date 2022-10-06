#!/usr/bin/env node

import path from 'node:path';
import { parseArgs } from 'node:util';
import { printHelp } from './help';
import { resolveConfig } from './util';
import reporters from './reporters';
import { run } from '.';
import type { ImportedConfiguration, Configuration } from './types';

const {
  values: {
    help,
    cwd: cwdArg,
    config,
    onlyFiles: isOnlyFiles = false,
    onlyExports: isOnlyExports = false,
    onlyTypes: isOnlyTypes = false,
    onlyDuplicates: isOnlyDuplicates = false,
    ignoreNamespaceImports = false,
    noProgress = false,
    reporter = 'symbols'
  }
} = parseArgs({
  options: {
    help: { type: 'boolean' },
    cwd: { type: 'string' },
    config: { type: 'string' },
    onlyFiles: { type: 'boolean' },
    onlyExports: { type: 'boolean' },
    onlyTypes: { type: 'boolean' },
    onlyDuplicates: { type: 'boolean' },
    ignoreNamespaceImports: { type: 'boolean' },
    noProgress: { type: 'boolean' },
    reporter: { type: 'string' }
  }
});

if (help || !config) {
  printHelp();
  process.exit(0);
}

const cwd = cwdArg ? path.resolve(cwdArg) : process.cwd();

const configuration: ImportedConfiguration = require(path.resolve(config));

const isShowProgress = !noProgress || !process.stdout.isTTY;
const isFindAll = !isOnlyFiles && !isOnlyExports && !isOnlyTypes && !isOnlyDuplicates;
const isFindUnusedFiles = isOnlyFiles === true || isFindAll;
const isFindUnusedExports = isOnlyExports === true || isFindAll;
const isFindUnusedTypes = isOnlyTypes === true || isFindAll;
const isFindDuplicateExports = isOnlyDuplicates === true || isFindAll;

const report =
  reporter in reporters ? reporters[reporter as keyof typeof reporters] : require(path.join(cwd, reporter));

const main = async () => {
  const resolvedConfig = resolveConfig(configuration, cwdArg);

  if (!resolvedConfig) {
    printHelp();
    process.exit(1);
  }

  const config: Configuration = Object.assign({}, resolvedConfig, {
    cwd,
    isOnlyFiles,
    isOnlyExports,
    isOnlyTypes,
    isOnlyDuplicates,
    isFindUnusedFiles,
    isFindUnusedExports,
    isFindUnusedTypes,
    isFindDuplicateExports,
    isFollowSymbols: !ignoreNamespaceImports,
    isShowProgress
  });

  const issues = await run(config);

  report({ issues, cwd, config });
};

main();
