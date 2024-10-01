import { fileURLToPath } from 'node:url';
import { type JitiOptions, createJiti } from 'jiti';
import { join } from './path.js';

const empty = join(fileURLToPath(import.meta.url), '../empty.js');

const options = {
  interopDefault: true,
  alias: {
    '@rushstack/eslint-config/patch/modern-module-resolution': empty,
    '@rushstack/eslint-patch/modern-module-resolution': empty,
  },
};

const createLoader = (options: JitiOptions) => createJiti(process.cwd(), options);

export const jiti = createLoader(options);
