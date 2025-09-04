// biome-ignore lint/nursery/noRestrictedImports: ignore
import path from 'node:path';

export const isAbsolute = path.isAbsolute;

export const dirname = path.posix.dirname;

export const extname = path.posix.extname;

export const basename = path.posix.basename;

export const join = path.posix.join;

export const toPosix = (value: string) => value.split(path.sep).join(path.posix.sep);

export const resolve = path.posix.resolve;

export const relative = (from: string, to: string) => toPosix(path.relative(from, to));

export const isInNodeModules = (filePath: string) => filePath.includes('node_modules');

export const toAbsolute = (id: string, base: string) => (isAbsolute(id) ? id : join(base, id));

export const toRelative = (id: string, base: string) => (isAbsolute(id) ? relative(base, id) : id);

export const isInternal = (id: string) => (id.startsWith('.') || isAbsolute(id)) && !isInNodeModules(id);

export const normalize = path.posix.normalize;
