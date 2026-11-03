import { fileURLToPath } from 'node:url';
import { createJiti, type JitiOptions } from 'jiti';
import { join } from './path.ts';

const empty = join(fileURLToPath(import.meta.url), '../empty.js');

const options = {
  alias: {
    '@rushstack/eslint-config/patch/modern-module-resolution': empty,
    '@rushstack/eslint-patch/modern-module-resolution': empty,
  },
  tsconfigPaths: true,
  jsx: true,
  // Replaces jiti's default `extensions`, so keep those and add `.jsx`
  extensions: ['.js', '.mjs', '.cjs', '.ts', '.tsx', '.mts', '.cts', '.mtsx', '.ctsx', '.jsx'],
};

const createLoader = (options: JitiOptions) => createJiti(process.cwd(), options);

export const jiti = createLoader(options);
