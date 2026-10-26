import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { LoaderError } from './errors.ts';
import { findFile, loadFile, loadJSON, loadJSONC, loadTOML, loadYAML, parseJSONC, parseYAML } from './fs.ts';
import { jiti } from './jiti.ts';
import { timerify } from './Performance.ts';
import { dirname, extname, isInternal, toNative } from './path.ts';

const unloaded = new Map<string, number>();

const isNativeModule = (filePath: string) => {
  const ext = extname(filePath);
  if (ext !== '.js') return ext === '.mjs';
  for (let dir = dirname(filePath); dir !== dirname(dir); dir = dirname(dir)) {
    const manifestPath = findFile(dir, 'package.json');
    if (manifestPath) return JSON.parse(readFileSync(manifestPath, 'utf8')).type === 'module';
  }
  return false;
};

const reload = async (filePath: string, version: number) => {
  let imported;
  try {
    imported = jiti(filePath);
  } catch {
    imported = await import(`${pathToFileURL(filePath).href}?v=${version}`);
  }
  return imported.default ?? imported;
};

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

    const version = unloaded.get(filePath);
    if (version && isNativeModule(filePath)) return await reload(filePath, version);

    return await jiti.import(filePath, { default: true });
  } catch (error) {
    throw new LoaderError(`Error loading ${filePath}`, { cause: error });
  }
};

export const _load = timerify(load);

const { cache } = createRequire(import.meta.url);

export const unload = (filePaths: Iterable<string>) => {
  for (const filePath of filePaths) {
    delete cache[filePath];
    delete cache[toNative(filePath)];
    unloaded.set(filePath, (unloaded.get(filePath) ?? 0) + 1);
  }
};
