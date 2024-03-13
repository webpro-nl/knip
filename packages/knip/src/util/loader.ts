import { pathToFileURL } from 'node:url';
import { LoaderError } from './errors.js';
import { loadJSON, loadYAML, loadTOML, loadFile, parseJSON, parseYAML } from './fs.js';
import { isTypeModule } from './fs.js';
import { extname } from './path.js';
import { timerify } from './Performance.js';
import { jitiCJS, jitiESM } from './register.js';

export const FAKE_PATH = '__FAKE__.json';

const load = async (filePath: string) => {
  // TODO: Turn into a config issue warning
  if (filePath === FAKE_PATH) return;
  try {
    const ext = extname(filePath);
    if (filePath.endsWith('rc')) {
      const contents = await loadFile(filePath);
      try {
        return parseYAML(contents);
      } catch {
        return parseJSON(filePath, contents);
      }
    }

    if (ext === '.yaml' || ext === '.yml') {
      return await loadYAML(filePath);
    }

    if (ext === '.json' || ext === '.jsonc') {
      return await loadJSON(filePath);
    }

    if (typeof Bun !== 'undefined') {
      const imported = await import(filePath);
      return imported.default ?? imported;
    }

    if (ext === '.toml') {
      return await loadTOML(filePath);
    }

    if (ext === '.mjs' || (ext === '.js' && isTypeModule(filePath))) {
      const fileUrl = pathToFileURL(filePath);
      const imported = await import(fileUrl.href);
      return imported.default ?? imported;
    }

    if (ext === '.mts' || (ext === '.ts' && isTypeModule(filePath))) {
      return await jitiESM(filePath);
    } else {
      return await jitiCJS(filePath);
    }
  } catch (error) {
    throw new LoaderError(`Error loading ${filePath}`, { cause: error });
  }
};

const loadFileAsync = async (filePath: string) => {
  // TODO: Turn into a config issue warning
  if (filePath === FAKE_PATH) return;
  try {
    return await loadFile(filePath);
  } catch (error) {
    throw new LoaderError(`Error loading ${filePath}`, { cause: error });
  }
};

export const _load = timerify(load);
export const _loadFile = timerify(loadFileAsync);
