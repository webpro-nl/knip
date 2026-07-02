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

const compilers = [
  { extensions: ['.mdx'], ...MDX },
  { extensions: ['.sass', '.scss'], ...SCSS },
  { extensions: ['.less'], ...LESS },
  { extensions: ['.styl', '.stylus'], ...STYLUS },
];

export const getIncludedCompilers = (
  syncCompilers: RawSyncCompilers,
  asyncCompilers: AsyncCompilers,
  dependencies: DependencySet,
  onReferencedDependency?: (packageName: string) => void
): Compilers => {
  for (const { extensions, dependencies: compilerDependencies, compiler } of compilers) {
    let hasCompilerDependency = false;
    for (const dependency of compilerDependencies) {
      if (dependencies.has(dependency)) {
        hasCompilerDependency = true;
        if (onReferencedDependency) onReferencedDependency(dependency);
        else break;
      }
    }
    for (const extension of extensions) {
      const existingCompiler = syncCompilers.get(extension);
      if (existingCompiler === true || (existingCompiler === undefined && hasCompilerDependency)) {
        syncCompilers.set(extension, compiler);
      }
    }
  }
  return [syncCompilers as SyncCompilers, asyncCompilers];
};

export const getCompilerExtensions = (compilers: [SyncCompilers, AsyncCompilers]) => [
  ...compilers[0].keys(),
  ...compilers[1].keys(),
];
