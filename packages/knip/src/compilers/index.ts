import type { RawConfiguration } from '../types/config.js';
import type { DependencySet } from '../types/workspace.js';
import AstroMDX from './astro-mdx.js';
import Astro from './astro.js';
import MDX from './mdx.js';
import Svelte from './svelte.js';
import type { AsyncCompilerFn, AsyncCompilers, RawSyncCompilers, SyncCompilerFn, SyncCompilers } from './types.js';
import Vue from './vue.js';

// TODO This does not detect functions returning a promise (just the async keyword)
const isAsync = (fn?: SyncCompilerFn | AsyncCompilerFn) => (fn ? fn.constructor.name === 'AsyncFunction' : false);

const normalizeExt = (ext: string) => ext.replace(/^\.*/, '.');

export const partitionCompilers = (rawLocalConfig: RawConfiguration) => {
  const syncCompilers: Record<string, SyncCompilerFn> = {};
  const asyncCompilers: Record<string, AsyncCompilerFn> = {};

  for (const extension in rawLocalConfig.compilers) {
    const ext = normalizeExt(extension);
    const compilerFn = rawLocalConfig.compilers[extension];
    if (typeof compilerFn === 'function') {
      if (!rawLocalConfig.asyncCompilers?.[ext] && isAsync(compilerFn)) {
        asyncCompilers[ext] = compilerFn as AsyncCompilerFn;
      } else {
        syncCompilers[ext] = compilerFn as SyncCompilerFn;
      }
    }
  }

  for (const extension in rawLocalConfig.asyncCompilers) {
    const ext = normalizeExt(extension);
    asyncCompilers[ext] = rawLocalConfig.asyncCompilers[extension] as AsyncCompilerFn;
  }

  return { ...rawLocalConfig, syncCompilers, asyncCompilers };
};

const compilers = new Map([
  ['.astro', Astro],
  ['.mdx', MDX],
  ['.svelte', Svelte],
  ['.vue', Vue],
]);

export const getIncludedCompilers = (
  syncCompilers: RawSyncCompilers,
  asyncCompilers: AsyncCompilers,
  dependencies: DependencySet
): [SyncCompilers, AsyncCompilers] => {
  const hasDependency = (packageName: string) => dependencies.has(packageName);

  for (const [extension, { condition, compiler }] of compilers.entries()) {
    // For MDX, try Astro compiler first if available
    if (extension === '.mdx' && AstroMDX.condition(hasDependency)) {
      syncCompilers.set(extension, AstroMDX.compiler);
    } else if ((!syncCompilers.has(extension) && condition(hasDependency)) || syncCompilers.get(extension) === true) {
      asyncCompilers.set(extension, compiler);
    }
  }
  return [syncCompilers as SyncCompilers, asyncCompilers];
};

export const getCompilerExtensions = (compilers: [SyncCompilers, AsyncCompilers]) => [
  ...compilers[0].keys(),
  ...compilers[1].keys(),
];
