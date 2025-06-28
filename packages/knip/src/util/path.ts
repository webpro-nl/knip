// biome-ignore lint/nursery/noRestrictedImports: ignore
import path from 'node:path';
import parsedArgValues from './cli-arguments.js';

const { directory } = parsedArgValues;

export const isAbsolute = path.isAbsolute;

export const dirname = path.posix.dirname;

export const extname = path.posix.extname;

export const basename = path.posix.basename;

export const join = path.posix.join;

export const toPosix = (value: string) => value.split(path.sep).join(path.posix.sep);

export const cwd = directory ? path.posix.resolve(directory) : toPosix(process.cwd());

export const resolve = (...paths: string[]) =>
  paths.length === 1 ? path.posix.join(cwd, paths[0]) : path.posix.resolve(...paths);

export const relative = (from: string, to?: string) => toPosix(path.relative(to ? from : cwd, to ?? from));

export const isInNodeModules = (filePath: string) => filePath.includes('node_modules');

export const toAbsolute = (id: string, base: string = cwd) => (isAbsolute(id) ? id : join(base, id));

export const toRelative = (id: string) => (isAbsolute(id) ? relative(id) : id);

export const isInternal = (id: string) => (id.startsWith('.') || isAbsolute(id)) && !isInNodeModules(id);
