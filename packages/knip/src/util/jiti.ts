import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import type { Jiti, JitiOptions } from 'jiti';
import { dirname, join, resolveCwd } from './path.ts';

const empty = join(fileURLToPath(import.meta.url), '../empty.js');

const options: JitiOptions = {
  alias: {
    '@rushstack/eslint-config/patch/modern-module-resolution': empty,
    '@rushstack/eslint-patch/modern-module-resolution': empty,
  },
  tsconfigPaths: true,
  jsx: true,
  // Replaces jiti's default `extensions`, so keep those and add `.jsx`
  extensions: ['.js', '.mjs', '.cjs', '.ts', '.tsx', '.mts', '.cts', '.mtsx', '.ctsx', '.jsx'],
};

const require = createRequire(import.meta.url);
const cache = new Map<string, Jiti>();

export const getJiti = (filePath: string) => {
  const dir = dirname(resolveCwd(filePath));
  let jiti = cache.get(dir);
  if (jiti) return jiti;
  const { createJiti }: typeof import('jiti') = require('jiti');
  jiti = createJiti(join(dir, '_index.js'), options);
  cache.set(dir, jiti);
  return jiti;
};
