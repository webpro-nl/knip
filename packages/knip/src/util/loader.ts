import { LoaderError } from './errors.js';
import { loadFile, loadJSON, loadJSONC, loadTOML, loadYAML, parseJSONC, parseYAML } from './fs.js';
import { jiti } from './jiti.js';
import { timerify } from './Performance.js';
import { extname, isInternal } from './path.js';

const PLAYWRIGHT_CONFIG_RE = /(^|[\\/])playwright\.config\.[cm]?[jt]s$/;
const resetPlaywrightInitiator = (filePath: string) => {
  if (PLAYWRIGHT_CONFIG_RE.test(filePath)) {
    // biome-ignore lint/performance/noDelete: need to delete property
    delete (process as NodeJS.Process & { __pw_initiator__?: unknown }).__pw_initiator__;
  }
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

    if (typeof Bun !== 'undefined') {
      const imported = await import(filePath);
      return imported.default ?? imported;
    }

    if (ext === '.toml') {
      return await loadTOML(filePath);
    }

    resetPlaywrightInitiator(filePath);
    return await jiti.import(filePath, { default: true });
  } catch (error) {
    throw new LoaderError(`Error loading ${filePath}`, { cause: error });
  }
};

export const _load = timerify(load);
