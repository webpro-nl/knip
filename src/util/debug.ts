import util from 'node:util';
import type { SourceFile } from 'ts-morph';

type Debug = { isEnabled: boolean; level: number };

// Inspect arrays, otherwise Node [will, knip, ...n-100 more items]
const logArray = (collection: string[]) => console.log(util.inspect(collection, { maxArrayLength: null }));

export const debugLogObject = (debug: Debug, minimumLevel: number, name: string, obj: unknown) => {
  if (minimumLevel > debug.level) return;
  console.log(`[knip] ${name}:`);
  console.log(util.inspect(obj, { depth: null, colors: true }));
};

export const debugLogFiles = (debug: Debug, minimumLevel: number, name: string, filePaths: string[]) => {
  if (minimumLevel > debug.level) return;
  console.debug(`[knip] ${name} (${filePaths.length}):`);
  if (debug.level > 1) {
    logArray(filePaths);
  }
};

export const debugLogSourceFiles = (debug: Debug, minimumLevel: number, name: string, sourceFiles: SourceFile[]) => {
  if (minimumLevel > debug.level) return;
  console.debug(`[knip] ${name} (${sourceFiles.length})`);
  if (debug.level > 1) {
    const files = sourceFiles.map(sourceFile => sourceFile.getFilePath());
    logArray(files);
  }
};

// ESLint should detect this unused variable within this file
const debugLogDiff = (debug: Debug, minimumLevel: number, name: string, arrA: string[], arrB: string[]) => {
  if (minimumLevel > debug.level) return;
  const onlyInA = arrA.filter(itemA => !arrB.includes(itemA)).sort();
  const onlyInB = arrB.filter(itemB => !arrA.includes(itemB)).sort();
  console.log(`[knip] ${name}`);
  console.log(`[knip] Only in left:`);
  logArray(onlyInA);
  console.log();
  console.log(`[knip] Only in right:`);
  logArray(onlyInB);
};
