#!/usr/bin/env node

import path from 'node:path';
import { parseArgs } from 'node:util';
import { printHelp } from './help';
import { importConfig, resolveConfig, resolveIncludedFromArgs } from './util/config';
import reporters from './reporters';
import { run } from '.';
import type { Configuration, IssueGroup } from './types';

const {
  values: {
    help,
    cwd: cwdArg,
    config = 'knip.json',
    only = [],
    exclude = [],
    'no-progress': noProgress = false,
    reporter = 'symbols',
    jsdoc = [],
    'max-issues': maxIssues = '0',
  },
} = parseArgs({
  options: {
    help: { type: 'boolean' },
    cwd: { type: 'string' },
    config: { type: 'string', short: 'c' },
    only: { type: 'string', multiple: true },
    exclude: { type: 'string', multiple: true },
    'no-progress': { type: 'boolean' },
    reporter: { type: 'string' },
    jsdoc: { type: 'string', multiple: true },
    'max-issues': { type: 'string' },
  },
});

if (help) {
  printHelp();
  process.exit(0);
}

const cwd = cwdArg ? path.resolve(cwdArg) : process.cwd();

const configuration = importConfig(cwd, config);

if (!configuration) {
  printHelp();
  process.exit(1);
}

const isShowProgress =
  noProgress === false ? process.stdout.isTTY && typeof process.stdout.cursorTo === 'function' : !noProgress;

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
    include: resolveIncludedFromArgs(only, exclude),
    isShowProgress,
    jsDocOptions: {
      isReadPublicTag: jsdoc.includes('public'),
    },
  });

  const { issues, counters } = await run(config);

  report({ issues, cwd, config });

  const group = include.files ? 'files' : (Object.keys(include) as IssueGroup[]).find(key => include[key]);
  if (group) {
    const count = counters[group];
    if (count > Number(maxIssues)) process.exit(count);
  }
};

main();
