import type { RawConfiguration } from '../types/config.ts';
import type { DependencySet } from '../types/workspace.ts';
import LESS from './less.ts';
import MDX from './mdx.ts';
import SCSS from './scss.ts';
import STYLUS from './stylus.ts';
import TSRX from './tsrx.ts';
import type { Compilers, RawCompilers } from './types.ts';

export const normalizeCompilerExtension = (ext: string) => ext.replace(/^\.*/, '.');

export const normalizeCompilers = (rawLocalConfig: RawConfiguration): RawCompilers => {
  const compilers: RawCompilers = new Map();

  for (const extension in rawLocalConfig.compilers) {
    const ext = normalizeCompilerExtension(extension);
    const compilerFn = rawLocalConfig.compilers[extension];
    if (typeof compilerFn === 'function' || compilerFn === true) compilers.set(ext, compilerFn);
  }

  for (const extension in rawLocalConfig.asyncCompilers) {
    const ext = normalizeCompilerExtension(extension);
    compilers.set(ext, rawLocalConfig.asyncCompilers[extension]);
  }

  return compilers;
};

const builtInCompilers = [
  { extensions: ['.mdx'], ...MDX },
  { extensions: ['.sass', '.scss'], ...SCSS },
  { extensions: ['.less'], ...LESS },
  { extensions: ['.styl', '.stylus'], ...STYLUS },
  { extensions: ['.tsrx'], ...TSRX },
];

export const getIncludedCompilers = (
  rawCompilers: RawCompilers,
  dependencies: DependencySet,
  onReferencedDependency?: (packageName: string) => void
): Compilers => {
  const compilers: Compilers = new Map();
  for (const [extension, compiler] of rawCompilers) {
    if (typeof compiler === 'function') compilers.set(extension, compiler);
  }
  for (const { extensions, dependencies: compilerDependencies, compiler } of builtInCompilers) {
    let hasCompilerDependency = false;
    for (const dependency of compilerDependencies) {
      if (dependencies.has(dependency)) {
        hasCompilerDependency = true;
        if (onReferencedDependency) onReferencedDependency(dependency);
        else break;
      }
    }
    for (const extension of extensions) {
      const existingCompiler = rawCompilers.get(extension);
      if (existingCompiler === true || (existingCompiler === undefined && hasCompilerDependency)) {
        compilers.set(extension, compiler);
      }
    }
  }
  return compilers;
};
