import path from 'node:path';

export const toPosix = (value: string) => value.split(path.sep).join(path.posix.sep);

export const cwd = toPosix(process.cwd());

export const resolve = (...paths: string[]) =>
  paths.length === 1 ? path.posix.join(cwd, paths[0]) : path.posix.resolve(...paths);

export const relative = (from: string, to?: string) =>
  path.posix.relative(to ? toPosix(from) : cwd, toPosix(to ?? from));

export const isAbsolute = (value: string) => value.startsWith('/') || /^[A-Z]:(\/|\\)/.test(value);

export const isInNodeModules = (filePath: string) => filePath.includes('node_modules');

export const join = path.posix.join;

export const extname = path.posix.extname;

export const dirname = path.posix.dirname;
