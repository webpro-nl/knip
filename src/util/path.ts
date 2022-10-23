import path from 'node:path';

const cwd = process.cwd();

export const relative = (to: string) => path.relative(cwd, to);
