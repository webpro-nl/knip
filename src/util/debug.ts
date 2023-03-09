import util from 'node:util';
import parsedArgs from './cli-arguments.js';

const { debug, 'debug-file-filter': debugFileFilter } = parsedArgs.values;

const IS_ENABLED = debug ?? false;
const FILE_FILTER = debugFileFilter;

const inspectOptions = { maxArrayLength: null, depth: null, colors: true };

// Inspect arrays, otherwise Node [will, knip, ...n-100 more items]
const logArray = (collection: string[]) => {
  if (FILE_FILTER) {
    const fileFilter = new RegExp(FILE_FILTER);
    const files = collection.filter(filePath => fileFilter.test(filePath));
    console.log(util.inspect(files.sort(), inspectOptions));
  } else {
    console.log(util.inspect(collection.sort(), inspectOptions));
  }
};

export const debugLog = (message: string) => {
  if (!IS_ENABLED) return;
  console.log(`[knip] ${message}`);
};

export const debugLogObject = (name: string, obj: unknown) => {
  if (!IS_ENABLED) return;
  console.log(`[knip] ${name}`);
  console.log(util.inspect(obj, inspectOptions));
};

export const debugLogArray = (name: string, sourceFiles: string[] | Set<string>) => {
  if (!IS_ENABLED) return;
  const collection = Array.from(sourceFiles);
  console.debug(`[knip] ${name} (${collection.length})`);
  logArray(collection);
};
