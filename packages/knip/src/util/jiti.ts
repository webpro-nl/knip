import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import type { Jiti, JitiOptions } from 'jiti';
import { join } from './path.ts';

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

const cwd = process.cwd();
const require = createRequire(import.meta.url);
let jiti: Jiti | undefined;

export const getJiti = () => {
  if (jiti) return jiti;
  const { createJiti }: typeof import('jiti') = require('jiti');
  return (jiti = createJiti(cwd, options));
};
