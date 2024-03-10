import { pathToFileURL } from 'node:url';
import { LoaderError } from './errors.js';
import { loadJSON, loadYAML, loadTOML, loadFile, parseJSON, parseYAML } from './fs.js';
import { isTypeModule } from './fs.js';
import { extname, isInternal } from './path.js';
import { timerify } from './Performance.js';
import { jitiCJS, jitiESM } from './register.js';

const load = async (filePath: string) => {
  try {
    const ext = extname(filePath);
    if (filePath.endsWith('rc')) {
      const contents = await loadFile(filePath);
      return parseYAML(contents).catch(() => parseJSON(filePath, contents));
    }

    if (ext === '' && isInternal(filePath)) {
      return await loadFile(filePath);
    }

    if (ext === '.json' || ext === '.jsonc') {
      return loadJSON(filePath);
    }

    if (ext === '.yaml' || ext === '.yml') {
      return loadYAML(filePath);
    }

    if (ext === '.toml') {
      return loadTOML(filePath);
    }

    if (ext === '.mjs' || (ext === '.js' && isTypeModule(filePath))) {
      const fileUrl = pathToFileURL(filePath);
      const imported = await import(fileUrl.href);
      return imported.default ?? imported;
    }

    if (ext === '.mts' || ((ext === '.ts' || ext === '.tsx') && isTypeModule(filePath))) {
      return await jitiESM(filePath);
    } else {
      return await jitiCJS(filePath);
    }
  } catch (error) {
    throw new LoaderError(`Error loading ${filePath}`, { cause: error });
  }
};

const loadFileAsync = async (filePath: string) => {
  try {
    return await loadFile(filePath);
  } catch (error) {
    throw new LoaderError(`Error loading ${filePath}`, { cause: error });
  }
};

export const _load = timerify(load);
export const _loadFile = timerify(loadFileAsync);
