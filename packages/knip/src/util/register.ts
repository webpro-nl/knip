import { fileURLToPath } from 'node:url';
import createJITI, { type JITIOptions } from 'jiti';
import { DEFAULT_EXTENSIONS } from '../constants.js';
import { join } from './path.js';

const empty = join(fileURLToPath(import.meta.url), '../empty.js');

const options = {
  interopDefault: true,
  extensions: DEFAULT_EXTENSIONS,
  esmResolve: false,
  alias: {
    '@rushstack/eslint-config/patch/modern-module-resolution': empty,
    '@rushstack/eslint-patch/modern-module-resolution': empty,
  },
};

// @ts-expect-error Our package.json has type=module (for globby, picocolors, etc), but here it confuses TypeScript
const createLoader = (options: JITIOptions) => createJITI(process.cwd(), options);

export const jitiCJS = createLoader(options);

export const jitiESM = createLoader({ ...options, esmResolve: true });
