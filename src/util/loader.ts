import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import yaml from 'js-yaml';
import { LoaderError } from './errors.js';
import { loadJSON } from './fs.js';
import { extname } from './path.js';
import { timerify } from './performance.js';
import { jiti } from './register.js';

const load = async (filePath: string) => {
  try {
    const ext = extname(filePath);
    if (ext === '.json' || ext === '.jsonc' || /rc$/.test(filePath)) {
      return loadJSON(filePath);
    }

    if (ext === '.yaml' || ext === '.yml') {
      return yaml.load((await fs.readFile(filePath)).toString());
    }

    if (ext === '.mjs') {
      const fileUrl = pathToFileURL(filePath);
      const imported = await import(fileUrl.href);
      return imported.default ?? imported;
    }

    return jiti(filePath);
  } catch (error) {
    throw new LoaderError(`Error loading ${filePath}`, { cause: error });
  }
};

export const _load = timerify(load);
