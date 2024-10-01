import { timerify } from './Performance.js';
import { LoaderError } from './errors.js';
import { loadFile, loadJSON, loadTOML, loadYAML, parseJSON, parseYAML } from './fs.js';
import { jiti } from './jiti.js';
import { extname, isInternal } from './path.js';

const load = async (filePath: string) => {
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

    if (ext === '' && isInternal(filePath)) {
      return await loadFile(filePath);
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

    return await jiti.import(filePath);
  } catch (error) {
    throw new LoaderError(`Error loading ${filePath}`, { cause: error });
  }
};

export const _load = timerify(load);
