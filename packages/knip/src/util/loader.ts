import { LoaderError } from './errors.ts';
import { loadFile, loadJSON, loadJSONC, loadTOML, loadYAML, parseJSONC, parseYAML } from './fs.ts';
import { jiti } from './jiti.ts';
import { timerify } from './Performance.ts';
import { extname, isInternal } from './path.ts';

const load = async (filePath: string) => {
  try {
    const ext = extname(filePath);
    if (filePath.endsWith('rc')) {
      const contents = await loadFile(filePath);
      try {
        return parseYAML(contents);
      } catch {
        return parseJSONC(filePath, contents);
      }
    }

    if (ext === '.yaml' || ext === '.yml') {
      return await loadYAML(filePath);
    }

    if (ext === '' && isInternal(filePath)) {
      return await loadFile(filePath);
    }

    if (ext === '.json') {
      return await loadJSON(filePath);
    }

    if (ext === '.jsonc' || ext === '.json5') {
      return await loadJSONC(filePath);
    }

    if ('Bun' in globalThis) {
      const imported = await import(filePath);
      return imported.default ?? imported;
    }

    if (ext === '.toml') {
      return await loadTOML(filePath);
    }

    return await jiti.import(filePath, { default: true });
  } catch (error) {
    throw new LoaderError(`Error loading ${filePath}`, { cause: error });
  }
};

export const _load = timerify(load);
