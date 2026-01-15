import { fileURLToPath } from 'node:url';
import { createJiti, type Jiti, type JitiOptions } from 'jiti';
import { join } from './path.js';

const empty = join(fileURLToPath(import.meta.url), '../empty.js');

const options: JitiOptions = {
  alias: {
    '@rushstack/eslint-config/patch/modern-module-resolution': empty,
    '@rushstack/eslint-patch/modern-module-resolution': empty,
  },
};

let _jiti: Jiti;

export const jiti = {
  import: (id: string, opts?: { default?: true }) => {
    _jiti ??= createJiti(process.cwd(), options);
    return _jiti.import(id, opts);
  },
};
