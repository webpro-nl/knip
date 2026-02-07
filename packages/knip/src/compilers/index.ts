import type { RawConfiguration } from '../types/config.js';
import type { DependencySet } from '../types/workspace.js';
import MDX from './mdx.js';
import SCSS from './scss.js';
import type {
  AsyncCompilers,
  CompilerAsync,
  CompilerSync,
  Compilers,
  RawSyncCompilers,
  SyncCompilers,
} from './types.js';

// TODO This does not detect functions returning a promise (just the async keyword)
export const isAsyncCompiler = (fn?: CompilerSync | CompilerAsync) =>
  fn ? fn.constructor.name === 'AsyncFunction' : false;

export const normalizeCompilerExtension = (ext: string) => ext.replace(/^\.*/, '.');

export const partitionCompilers = (rawLocalConfig: RawConfiguration) => {
  const syncCompilers: Record<string, CompilerSync | true> = {};
  const asyncCompilers: Record<string, CompilerAsync> = {};

  for (const extension in rawLocalConfig.compilers) {
    const ext = normalizeCompilerExtension(extension);
    const compilerFn = rawLocalConfig.compilers[extension];
    if (typeof compilerFn === 'function') {
      if (!rawLocalConfig.asyncCompilers?.[ext] && isAsyncCompiler(compilerFn)) {
        asyncCompilers[ext] = compilerFn as CompilerAsync;
      } else {
        syncCompilers[ext] = compilerFn as CompilerSync;
      }
    } else if (compilerFn === true) {
      syncCompilers[ext] = true;
    }
  }

  for (const extension in rawLocalConfig.asyncCompilers) {
    const ext = normalizeCompilerExtension(extension);
    asyncCompilers[ext] = rawLocalConfig.asyncCompilers[extension] as CompilerAsync;
  }

  return { ...rawLocalConfig, syncCompilers, asyncCompilers };
};

const compilers = new Map([
  ['.mdx', MDX],
  ['.sass', SCSS],
  ['.scss', SCSS],
]);

export const getIncludedCompilers = (
  syncCompilers: RawSyncCompilers,
  asyncCompilers: AsyncCompilers,
  dependencies: DependencySet
): Compilers => {
  const hasDependency = (packageName: string) => dependencies.has(packageName);
  for (const [extension, { condition, compiler }] of compilers) {
    if ((!syncCompilers.has(extension) && condition(hasDependency)) || syncCompilers.get(extension) === true) {
      syncCompilers.set(extension, compiler);
    }
  }
  return [syncCompilers as SyncCompilers, asyncCompilers];
};

export const getCompilerExtensions = (compilers: [SyncCompilers, AsyncCompilers]) => [
  ...compilers[0].keys(),
  ...compilers[1].keys(),
];
