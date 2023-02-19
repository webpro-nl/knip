import { exportedValue } from './my-module.js';
import { num, str, functionName, className, generatorFunctionName, name1, name4, exportedA, exportedB } from './named';
import type { MyEnum, Str, MyInterface } from './types';

const dynamic = import('./dynamic-import');

async function main() {
  const { used } = await import('./dynamic-import');
}

export const entryFileExport = exportedValue;

export type EntryFileExportType = any;
