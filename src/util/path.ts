import path from 'node:path';

const cwd = process.cwd();

export const toPosixPath = (value: string) => value.split(path.sep).join(path.posix.sep);

export const relativePosix = (from: string, to?: string) => toPosixPath(path.relative(to ? from : cwd, to ?? from));

export const isAbsolute = (value: string) => /^(\/|[A-Z]:)/.test(value);
