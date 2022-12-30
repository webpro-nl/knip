import util from 'node:util';
import parsedArgs from './parsed-cli-arguments.js';
import type { Issue } from '../types/issues.js';
import type { SourceFile } from 'ts-morph';

const { debug, 'debug-file-filter': debugFileFilter } = parsedArgs.values;

const IS_ENABLED = debug ?? false;
const FILE_FILTER = debugFileFilter;

// Inspect arrays, otherwise Node [will, knip, ...n-100 more items]
const logArray = (collection: string[]) => console.log(util.inspect(collection.sort(), { maxArrayLength: null }));

export const debugLogObject = (name: string, obj: unknown) => {
  if (!IS_ENABLED) return;
  console.log(`[knip] ${name}`);
  console.log(util.inspect(obj, { depth: null, colors: true }));
};

export const debugLogFiles = (name: string, filePaths: Set<string> | string[]) => {
  if (!IS_ENABLED) return;
  const size = Array.isArray(filePaths) ? filePaths.length : filePaths.size;
  console.debug(`[knip] ${name} (${size})`);
  if (FILE_FILTER) {
    const fileFilter = new RegExp(FILE_FILTER);
    logArray(Array.from(filePaths).filter(filePath => fileFilter.test(filePath)));
  } else {
    logArray(Array.from(filePaths));
  }
};

export const debugLogSourceFiles = (name: string, sourceFiles: Set<SourceFile> | SourceFile[]) => {
  if (!IS_ENABLED) return;
  const size = Array.isArray(sourceFiles) ? sourceFiles.length : sourceFiles.size;
  console.debug(`[knip] ${name} (${size})`);
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
};

export const debugLogIssues = (name: string, issues: Issue[]) => {
  if (!IS_ENABLED) return;
  const symbols = Array.from(new Set(issues.map(issue => issue.symbol)));
  console.debug(`[knip] ${name} (${symbols.length})`);
  logArray(symbols);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const debugLogDiff = (name: string, arrA: string[], arrB: string[]) => {
  const onlyInA = arrA.filter(itemA => !arrB.includes(itemA)).sort();
  const onlyInB = arrB.filter(itemB => !arrA.includes(itemB)).sort();
  console.log(`[knip] ${name}`);
  console.log(`[knip] Only in left:`);
  logArray(onlyInA);
  console.log();
  console.log(`[knip] Only in right:`);
  logArray(onlyInB);
};
