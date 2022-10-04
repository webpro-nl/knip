#!/usr/bin/env node

import path from 'node:path';
import { parseArgs } from 'node:util';
import { printHelp } from './help';
import { logIssueGroupResult } from './log';
import { run } from '.';
import type { Configuration } from './types';

const {
  positionals: [cwdArg],
  values: {
    help,
    config,
    onlyFiles,
    onlyExports,
    onlyTypes,
    onlyDuplicates,
    ignoreNamespaceImports = false,
    hideProgress = false
  }
} = parseArgs({
  allowPositionals: true,
  options: {
    help: { type: 'boolean' },
    config: { type: 'string' },
    onlyFiles: { type: 'boolean' },
    onlyExports: { type: 'boolean' },
    onlyTypes: { type: 'boolean' },
    onlyDuplicates: { type: 'boolean' },
    ignoreNamespaceImports: { type: 'boolean' },
    hideProgress: { type: 'boolean' }
  }
});

if (help || !config) {
  printHelp();
  process.exit();
}

const cwd = cwdArg ? path.resolve(cwdArg) : process.cwd();

const configuration: Configuration = require(path.resolve(config));

const isShowProgress = !hideProgress || !process.stdout.isTTY;
const isFindAll = !onlyFiles && !onlyExports && !onlyTypes && !onlyDuplicates;
const isFindUnusedFiles = onlyFiles === true || isFindAll;
const isFindUnusedExports = onlyExports === true || isFindAll;
const isFindUnusedTypes = onlyTypes === true || isFindAll;
const isFindDuplicateExports = onlyDuplicates === true || isFindAll;

const main = async () => {
  const { allUnusedFiles, allUnusedExports, allUnusedTypes, allDuplicateExports } = await run({
    ...configuration,
    cwd,
    isShowProgress,
    isFindUnusedFiles,
    isFindUnusedExports,
    isFindUnusedTypes,
    isFindDuplicateExports,
    isIgnoreNamespaceImports: Boolean(ignoreNamespaceImports)
  });

  if (isFindUnusedFiles) logIssueGroupResult(cwd, 'UNUSED FILES', allUnusedFiles);
  if (isFindUnusedExports) logIssueGroupResult(cwd, 'UNUSED EXPORTS', allUnusedExports);
  if (isFindUnusedTypes) logIssueGroupResult(cwd, 'UNUSED TYPES', allUnusedTypes);
  if (isFindDuplicateExports) logIssueGroupResult(cwd, 'DUPLICATE EXPORTS', allDuplicateExports);
};

main();
