import { fileURLToPath } from 'node:url';
import { type JitiOptions, createJiti } from 'jiti';
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

const createLoader = (options: JitiOptions) => createJiti(process.cwd(), options);

export const jiti = createLoader(options);
