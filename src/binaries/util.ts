import { isInNodeModules, join } from '../util/path.js';
import { _tryResolve } from '../util/require.js';

export const tryResolveFilePath = (cwd: string, specifier: string, fallback?: string) => {
  if (specifier) {
    const filePath = join(cwd, specifier);
    if (!isInNodeModules(filePath)) {
      const resolvedFilePath = _tryResolve(filePath, cwd);
      if (resolvedFilePath) return [resolvedFilePath];
    }
    return fallback ? [stripNodeModulesFromPath(fallback)] : [];
  }
  return [];
};

export const tryResolveFilePaths = (cwd: string, specifiers: string[]) =>
  specifiers.flatMap(specifier => tryResolveFilePath(cwd, specifier, specifier));

export const toBinary = (specifier: string) => specifier.replace(/^(bin:)?/, 'bin:');

export const fromBinary = (specifier: string) => specifier.replace(/^(bin:)?/, '');

export const isBinary = (specifier: string) => specifier.startsWith('bin:');

const stripNodeModulesFromPath = (command: string) => command.replace(/^(\.\/)?node_modules\//, '');

export const stripBinaryPath = (command: string) =>
  stripNodeModulesFromPath(command)
    .replace(/^(\.bin\/)/, '')
    .replace(/\$\(npm bin\)\/(\w+)/, '$1')
    .replace(/(\S+)@.*/, '$1');
