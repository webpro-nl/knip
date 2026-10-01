import './odd';
import { exportedResult } from './my-module.js';
import {
  num,
  str,
  functionName,
  className,
  generatorFunctionName,
  name1,
  name4,
  exportedA,
  exportedB,
} from './named-exports';
import type { MyNum, MyString, MyInterface } from './types';

num;
str;
functionName;
className;
generatorFunctionName;
name1;
name4;
exportedA;
exportedB;

type Used = MyNum | MyString | MyInterface;

const dynamic = await import('./dynamic-import');
dynamic;

async function main() {
  const { used } = await import('./dynamic-import');
  used;
}

export const entryFileExport = exportedResult;

export type EntryFileExportType = any;

export type { MixType } from './my-mix';

export { MixClass } from './my-mix';
