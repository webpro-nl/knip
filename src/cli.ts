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
    onlyNsMembers: isOnlyNsMembers = false,
    onlyDuplicates: isOnlyDuplicates = false,
    noProgress = false,
    reporter = 'symbols',
    jsdoc = [],
  },
} = parseArgs({
  options: {
    help: { type: 'boolean' },
    cwd: { type: 'string' },
    config: { type: 'string' },
    onlyFiles: { type: 'boolean' },
    onlyExports: { type: 'boolean' },
    onlyTypes: { type: 'boolean' },
    onlyDuplicates: { type: 'boolean' },
    onlyNsMembers: { type: 'boolean' },
    noProgress: { type: 'boolean' },
    reporter: { type: 'string' },
    jsdoc: { type: 'string', multiple: true },
  },
});

if (help || !config) {
  printHelp();
  process.exit(0);
}

const cwd = cwdArg ? path.resolve(cwdArg) : process.cwd();

const configuration: ImportedConfiguration = require(path.resolve(config));

const isShowProgress = !noProgress || !process.stdout.isTTY;
const isFindAll = !isOnlyFiles && !isOnlyExports && !isOnlyTypes && !isOnlyNsMembers && !isOnlyDuplicates;
const isFindUnusedFiles = isOnlyFiles === true || isFindAll;
const isFindUnusedExports = isOnlyExports === true || isFindAll;
const isFindUnusedTypes = isOnlyTypes === true || isFindAll;
const isFindNsImports = isOnlyNsMembers === true || isFindAll;
const isFindDuplicateExports = isOnlyDuplicates === true || isFindAll;

const report =
  reporter in reporters ? reporters[reporter as keyof typeof reporters] : require(path.join(cwd, reporter));

const jsDocOptions = {
  isReadPublicTag: jsdoc.includes('public'),
};

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
    isOnlyNsMembers,
    isOnlyDuplicates,
    isFindUnusedFiles,
    isFindUnusedExports,
    isFindUnusedTypes,
    isFindNsImports,
    isFindDuplicateExports,
    isShowProgress,
    jsDocOptions,
  });

  const issues = await run(config);

  report({ issues, cwd, config });
};

main();
