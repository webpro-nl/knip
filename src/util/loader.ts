import path from 'node:path';
import { pathToFileURL } from 'node:url';
// eslint-disable-next-line import/order -- Modules in @types are handled differently
import { load as esmLoad } from '@esbuild-kit/esm-loader';
import { require } from '../util/require.js';
import { LoaderError } from './errors.js';
import { loadJSON, loadYAML } from './fs.js';
import { timerify } from './performance.js';

const load = async (filePath: string) => {
  try {
    const ext = path.extname(filePath);
    if (/rc$/.test(filePath)) {
      try {
        // Note: `await` is needed for the try-catch to work.
        return await loadYAML(filePath);
      } catch {
        return loadJSON(filePath);
      }
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

    const imported = await esmLoad(filePath, {}, require);
    return imported.default ?? imported;
  } catch (error) {
    throw new LoaderError(`Error loading ${filePath}`, { cause: error });
  }
};

export const _load = timerify(load);
