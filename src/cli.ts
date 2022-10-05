#!/usr/bin/env node

import path from 'node:path';
import { parseArgs } from 'node:util';
import { printHelp } from './help';
import { resolveConfig } from './util';
import { logIssueGroupResult } from './log';
import { run } from '.';
import type { ImportedConfiguration } from './types';

const {
  values: {
    help,
    cwd: cwdArg,
    config,
    onlyFiles,
    onlyExports,
    onlyTypes,
    onlyDuplicates,
    ignoreNamespaceImports = false,
    noProgress = false
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
    noProgress: { type: 'boolean' }
  }
});

if (help || !config) {
  printHelp();
  process.exit(0);
}

const cwd = cwdArg ? path.resolve(cwdArg) : process.cwd();

const configuration: ImportedConfiguration = require(path.resolve(config));

const isShowProgress = !noProgress || !process.stdout.isTTY;
const isFindAll = !onlyFiles && !onlyExports && !onlyTypes && !onlyDuplicates;
const isFindUnusedFiles = onlyFiles === true || isFindAll;
const isFindUnusedExports = onlyExports === true || isFindAll;
const isFindUnusedTypes = onlyTypes === true || isFindAll;
const isFindDuplicateExports = onlyDuplicates === true || isFindAll;

const main = async () => {
  const config = resolveConfig(configuration, cwdArg);
  if (!config) {
    printHelp();
    process.exit(1);
  }
  const issues = await run({
    ...config,
    cwd,
    isShowProgress,
    isFindUnusedFiles,
    isFindUnusedExports,
    isFindUnusedTypes,
    isFindDuplicateExports,
    isFollowSymbols: !ignoreNamespaceImports
  });

  if (isFindUnusedFiles) logIssueGroupResult(cwd, 'UNUSED FILES', issues.file);
  if (isFindUnusedExports) logIssueGroupResult(cwd, 'UNUSED EXPORTS', issues.export);
  if (isFindUnusedTypes) logIssueGroupResult(cwd, 'UNUSED TYPES', issues.type);
  if (isFindDuplicateExports) logIssueGroupResult(cwd, 'DUPLICATE EXPORTS', issues.duplicate);
};

main();
