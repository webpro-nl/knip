// oxlint-disable-next-line no-restricted-imports
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { join, toPosix } from '../../src/util/path.ts';

const base = toPosix(path.join(path.dirname(fileURLToPath(import.meta.url)), '../..'));

export const resolve = (id: string) => join(base, id);
