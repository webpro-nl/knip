import util from 'node:util';
import type { SourceFile } from 'ts-morph';

type Config = { debug: { isEnabled: boolean; level: number } };

// Inspect arrays, otherwise Node [will, knip, ...n-100 more items]
const logArray = (collection: string[]) => console.log(util.inspect(collection, { maxArrayLength: null }));

export const debugLogObject = (config: Config, minimumLevel: number, name: string, obj: unknown) => {
  if (minimumLevel > config.debug.level) return;
  console.log(`[knip] ${name}:`);
  console.log(util.inspect(obj, { depth: null, colors: true }));
};

export const debugLogFiles = (config: Config, minimumLevel: number, name: string, filePaths: string[]) => {
  if (minimumLevel > config.debug.level) return;
  const { debug } = config;
  if (debug.level > 1) {
    console.debug(`[knip] ${name} (${filePaths.length}):`);
    logArray(filePaths);
  } else {
    console.debug(`[knip] ${name} (${filePaths.length})`);
  }
};

export const debugLogSourceFiles = (config: Config, minimumLevel: number, name: string, sourceFiles: SourceFile[]) => {
  if (minimumLevel > config.debug.level) return;
  const { debug } = config;
  if (debug.level > 1) {
    // let files = Array.from(sourceFiles);
    console.debug(`[knip] ${name} (${sourceFiles.length}):`);
    logArray(sourceFiles.map(sourceFile => sourceFile.getFilePath()));
  } else {
    console.debug(`[knip] ${name} (${sourceFiles.length})`);
  }
};

// ESLint should detect this unused variable within this file
const debugLogDiff = (config: Config, minimumLevel: number, name: string, arrA: string[], arrB: string[]) => {
  if (minimumLevel > config.debug.level) return;
  const onlyInA = arrA.filter(itemA => !arrB.includes(itemA)).sort();
  const onlyInB = arrB.filter(itemB => !arrA.includes(itemB)).sort();
  console.log(`[knip] ${name}`);
  console.log(`[knip] Only in left:`);
  logArray(onlyInA);
  console.log();
  console.log(`[knip] Only in right:`);
  logArray(onlyInB);
};
