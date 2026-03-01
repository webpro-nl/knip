// oxlint-disable-next-line no-restricted-imports
import path from 'node:path';

const isWin = process.platform === 'win32';

export const isAbsolute = path.isAbsolute;

export const dirname = path.posix.dirname;

export const extname = path.posix.extname;

export const basename = path.posix.basename;

export const join = path.posix.join;

export const toPosix = (value: string) => value.split(path.sep).join(path.posix.sep);

export const resolve = path.posix.resolve;

export const relative = (from: string, to: string) => {
  if (to.startsWith(from)) {
    const next = to[from.length];
    if (next === '/') return to.substring(from.length + 1);
    if (next === undefined) return '.';
  }
  const result = path.relative(from, to);
  return isWin ? toPosix(result) : result || '.';
};

export const isInNodeModules = (filePath: string) => filePath.includes('node_modules');

export const toAbsolute = (id: string, base: string) => (isAbsolute(id) ? id : join(base, id));

export const toRelative = (id: string, base: string) => (isAbsolute(id) ? relative(base, id) : id);

export const isInternal = (id: string) => (id.startsWith('.') || isAbsolute(id)) && !isInNodeModules(id);

export const normalize = path.posix.normalize;
