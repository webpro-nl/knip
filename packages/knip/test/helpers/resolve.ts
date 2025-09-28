// biome-ignore lint: style/noRestrictedImports
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { join, toPosix } from '../../src/util/path.js';

const base = toPosix(path.join(path.dirname(fileURLToPath(import.meta.url)), '../..'));

export const resolve = (id: string) => join(base, id);
