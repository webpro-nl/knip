import { readFileSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import yaml from 'js-yaml';
import { parse as parseTOML } from 'smol-toml';
import stripJsonComments from 'strip-json-comments';
import { LoaderError } from './errors.js';
import { dirname, join } from './path.js';
import { timerify } from './Performance.js';

export const isDirectory = (filePath: string) => {
  const stat = statSync(filePath, { throwIfNoEntry: false });
  return stat !== undefined && stat.isDirectory();
};

export const isFile = (filePath: string) => {
  const stat = statSync(filePath, { throwIfNoEntry: false });
  return stat !== undefined && stat.isFile();
};

export const findFile = (workingDir: string, fileName: string) => {
  const filePath = join(workingDir, fileName);
  return isFile(filePath) ? filePath : undefined;
};

export const loadFile = async (filePath: string) => {
  try {
    const contents = await readFile(filePath);
    return contents.toString();
  } catch (error) {
    throw new LoaderError(`Error loading ${filePath}`, { cause: error });
  }
};

export const loadJSON = async (filePath: string) => {
  const contents = await loadFile(filePath);
  return parseJSON(filePath, contents);
};

export const loadYAML = async (filePath: string) => {
  const contents = await loadFile(filePath);
  return parseYAML(contents);
};

export const loadTOML = async (filePath: string) => {
  const contents = await loadFile(filePath);
  return parseTOML(contents);
};

export const parseJSON = async (filePath: string, contents: string) => {
  try {
    return JSON.parse(stripJsonComments(contents, { trailingCommas: true }));
  } catch (error) {
    throw new LoaderError(`Error parsing ${filePath}`, { cause: error });
  }
};

export const parseYAML = async (contents: string) => {
  return yaml.load(contents);
};

export function isTypeModule(path: string) {
  while (path && path !== '.' && path !== '/') {
    path = dirname(path);
    try {
      const pkg = readFileSync(join(path, 'package.json'), 'utf-8');
      try {
        return JSON.parse(pkg).type === 'module';
        // eslint-disable-next-line no-empty
      } catch {}
      break;
      // eslint-disable-next-line no-empty
    } catch {}
  }
  return false;
}

export const _loadJSON = timerify(loadJSON);
