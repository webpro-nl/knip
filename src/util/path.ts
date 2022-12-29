import path from 'node:path';
import { ensurePosixPath } from './glob.js';

const cwd = process.cwd();

export const relative = (to: string) => ensurePosixPath(path.relative(cwd, to));
