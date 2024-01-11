import createJITI, { type JITIOptions } from 'jiti';
import { DEFAULT_EXTENSIONS } from '../constants.js';

const options = {
  interopDefault: true,
  extensions: DEFAULT_EXTENSIONS,
  esmResolve: false,
};

// @ts-expect-error Our package.json has type=module (for globby, picocolors, etc), but here it confuses TypeScript
const createLoader = (options: JITIOptions) => createJITI(process.cwd(), options);

export const jitiCJS = createLoader(options);

export const jitiESM = createLoader({ ...options, esmResolve: true });
