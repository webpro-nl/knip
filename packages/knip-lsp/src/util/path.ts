// Path utilities for knip-lsp
// Matches the approach used in knip's src/util/path.ts
// Uses posix paths for consistency across platforms

import path from 'node:path';

/**
 * Convert a path to posix format (forward slashes)
 */
export const toPosix = (value: string) => value.split(path.sep).join(path.posix.sep);

/**
 * Get the current working directory in posix format
 */
export const cwd = toPosix(process.cwd());

/**
 * Check if a path is absolute
 */
export const isAbsolute = path.posix.isAbsolute;

/**
 * Join path segments using posix separator
 */
export const join = path.posix.join;

/**
 * Get the directory name of a path
 */
export const dirname = path.posix.dirname;

/**
 * Get the file extension
 */
export const extname = path.posix.extname;

/**
 * Get the base name of a file
 */
export const basename = path.posix.basename;

/**
 * Resolve a path to absolute
 */
export const resolve = (...paths: string[]) =>
  paths.length === 1 ? path.posix.join(cwd, paths[0]) : path.posix.resolve(...paths);

/**
 * Get relative path between two paths
 */
export const relative = (from: string, to?: string) => 
  toPosix(path.relative(to ? from : cwd, to ?? from));

/**
 * Convert a path to absolute, handling both absolute and relative paths
 * @param id The path to convert
 * @param base The base directory for relative paths (defaults to cwd)
 */
export const toAbsolute = (id: string, base: string = cwd): string => {
  const posixBase = toPosix(base);
  const posixId = toPosix(id);
  return isAbsolute(posixId) ? posixId : join(posixBase, posixId);
};

/**
 * Convert an absolute path to relative
 */
export const toRelative = (id: string) => (isAbsolute(id) ? relative(id) : id);

/**
 * Check if a path is in node_modules
 */
export const isInNodeModules = (filePath: string) => filePath.includes('node_modules');

/**
 * Check if a path is internal (relative or absolute, not in node_modules)
 */
export const isInternal = (id: string) => 
  (id.startsWith('.') || isAbsolute(id)) && !isInNodeModules(id);