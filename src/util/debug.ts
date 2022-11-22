import util from 'node:util';
import parsedArgs from './parseArgs.js';
import type { Issue } from '../types/issues.js';
import type { SourceFile } from 'ts-morph';

const { debug, 'debug-level': debugLevel = 1, 'debug-file-filter': debugFileFilter } = parsedArgs.values;

const IS_ENABLED = debug ?? false;
const LEVEL = IS_ENABLED && debugLevel ? Number(debugLevel) : 0;
const FILE_FILTER = debugFileFilter;

// Inspect arrays, otherwise Node [will, knip, ...n-100 more items]
const logArray = (collection: string[]) => console.log(util.inspect(collection.sort(), { maxArrayLength: null }));

export const debugLogObject = (minimumLevel: number, name: string, obj: unknown) => {
  if (minimumLevel > LEVEL) return;
  console.log(`[knip] ${name}`);
  console.log(util.inspect(obj, { depth: null, colors: true }));
};

export const debugLogFiles = (minimumLevel: number, name: string, filePaths: Set<string> | string[]) => {
  const size = Array.isArray(filePaths) ? filePaths.length : filePaths.size;
  if (minimumLevel > LEVEL) return;
  console.debug(`[knip] ${name} (${size})`);
  if (LEVEL > 1) {
    if (FILE_FILTER) {
      const fileFilter = new RegExp(FILE_FILTER);
      logArray(Array.from(filePaths).filter(filePath => fileFilter.test(filePath)));
    } else {
      logArray(Array.from(filePaths));
    }
  }
};

export const debugLogSourceFiles = (
  minimumLevel: number,
  name: string,
  sourceFiles: Set<SourceFile> | SourceFile[]
) => {
  if (minimumLevel > LEVEL) return;
  const size = Array.isArray(sourceFiles) ? sourceFiles.length : sourceFiles.size;
  console.debug(`[knip] ${name} (${size})`);
  if (LEVEL > 1) {
    if (FILE_FILTER) {
      const fileFilter = new RegExp(FILE_FILTER);
      const files = Array.from(sourceFiles)
        .map(sourceFile => sourceFile.getFilePath())
        .filter(filePath => fileFilter.test(filePath));
      logArray(files);
    } else {
      const files = Array.from(sourceFiles).map(sourceFile => sourceFile.getFilePath());
      logArray(files);
    }
  }
};

export const debugLogIssues = (minimumLevel: number, name: string, issues: Issue[]) => {
  if (minimumLevel > LEVEL) return;
  const symbols = Array.from(new Set(issues.map(issue => issue.symbol)));
  console.debug(`[knip] ${name} (${symbols.length})`);
  if (LEVEL > 1) {
    logArray(symbols);
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const debugLogDiff = (minimumLevel: number, name: string, arrA: string[], arrB: string[]) => {
  if (minimumLevel > LEVEL) return;
  const onlyInA = arrA.filter(itemA => !arrB.includes(itemA)).sort();
  const onlyInB = arrB.filter(itemB => !arrA.includes(itemB)).sort();
  console.log(`[knip] ${name}`);
  console.log(`[knip] Only in left:`);
  logArray(onlyInA);
  console.log();
  console.log(`[knip] Only in right:`);
  logArray(onlyInB);
};
