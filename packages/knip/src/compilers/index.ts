import type { RawConfiguration } from '../types/config.js';
import type { DependencySet } from '../types/workspace.js';
import Astro from './astro.js';
import AstroMDX from './astro-mdx.js';
import MDX from './mdx.js';
import Svelte from './svelte.js';
import CSS from './tailwind.js';
import type { AsyncCompilerFn, AsyncCompilers, HasDependency, RawSyncCompilers, SyncCompilerFn, SyncCompilers } from './types.js';
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

const asyncBuiltInCompilers = new Map([
  ['.astro', Astro]
])

const syncBuiltInCompilers = new Map([
  ['.css', CSS],
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

  for (const [extension, { condition, compiler }] of asyncBuiltInCompilers.entries()) {
    if (condition(hasDependency)) {
      asyncCompilers.set(extension, compiler)
    }
  }

  for (const [extension, { condition, compiler }] of syncBuiltInCompilers.entries()) {
    const isAstroMDX = extension === '.mdx' && AstroMDX.condition(hasDependency) // If the extension is mdx but the project seems to be Astro, use the AstroMDX compiler not the standard one
    const isManuallyEnabled = syncCompilers.get(extension) === true // if the syncCompiler's value is true, instead of a compiler function, it means the compiler has been manually enabled by the user. We then replace `true` with the compiler function.
    const isFirstWithDependency = !syncCompilers.has(extension) && condition(hasDependency) // Insert the compiler, but don't overwrite

    if (isAstroMDX) {
      syncCompilers.set(extension, AstroMDX.compiler);
    } else if(isManuallyEnabled || isFirstWithDependency) {
      syncCompilers.set(extension, compiler)
    }
  }
  return [syncCompilers as SyncCompilers, asyncCompilers];
};

export const getCompilerExtensions = (compilers: [SyncCompilers, AsyncCompilers]) => [
  ...compilers[0].keys(),
  ...compilers[1].keys(),
];
