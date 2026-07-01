import type { RawConfiguration } from '../types/config.ts';
import type { DependencySet } from '../types/workspace.ts';
import LESS from './less.ts';
import MDX from './mdx.ts';
import SCSS from './scss.ts';
import STYLUS from './stylus.ts';
import type {
  AsyncCompilers,
  CompilerAsync,
  CompilerSync,
  Compilers,
  RawSyncCompilers,
  SyncCompilers,
} from './types.ts';

// TODO This does not detect functions returning a promise (just the async keyword)
const isAsyncCompiler = (fn?: CompilerSync | CompilerAsync) => (fn ? fn.constructor.name === 'AsyncFunction' : false);

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
  ['.less', LESS],
  ['.styl', STYLUS],
  ['.stylus', STYLUS],
]);

export const getIncludedCompilers = (
  syncCompilers: RawSyncCompilers,
  asyncCompilers: AsyncCompilers,
  dependencies: DependencySet,
  onReferencedDependency?: (packageName: string) => void
): Compilers => {
  const hasDependency = (packageName: string) => dependencies.has(packageName);
  for (const [extension, { dependencies: compilerDependencies, compiler }] of compilers) {
    if (
      (!syncCompilers.has(extension) && compilerDependencies.some(hasDependency)) ||
      syncCompilers.get(extension) === true
    ) {
      syncCompilers.set(extension, compiler);
    }
    if (onReferencedDependency)
      for (const dependency of compilerDependencies) if (hasDependency(dependency)) onReferencedDependency(dependency);
  }
  return [syncCompilers as SyncCompilers, asyncCompilers];
};

export const getCompilerExtensions = (compilers: [SyncCompilers, AsyncCompilers]) => [
  ...compilers[0].keys(),
  ...compilers[1].keys(),
];
