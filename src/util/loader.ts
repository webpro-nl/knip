import { pathToFileURL } from 'node:url';
import { LoaderError } from './errors.js';
import { loadJSON, loadYAML, loadFile, parseJSON, parseYAML } from './fs.js';
import { extname } from './path.js';
import { timerify } from './Performance.js';
import { jiti } from './register.js';

const load = async (filePath: string) => {
  try {
    const ext = extname(filePath);
    if (/rc$/.test(filePath)) {
      const contents = await loadFile(filePath);
      return parseYAML(contents).catch(() => parseJSON(contents));
    }

    if (ext === '.json' || ext === '.jsonc') {
      return loadJSON(filePath);
    }

    if (ext === '.yaml' || ext === '.yml') {
      return loadYAML(filePath);
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
