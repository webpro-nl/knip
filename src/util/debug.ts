import util from 'node:util';
import parsedArgs from './cli-arguments.js';
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
