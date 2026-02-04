import { readdirSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import yaml from 'js-yaml';
import { parse as parseTOML } from 'smol-toml';
import stripJsonComments from 'strip-json-comments';
import { LoaderError } from './errors.js';
import { extname, join } from './path.js';

export const isDirectory = (cwdOrPath: string, name?: string) => {
  try {
    return statSync(name ? join(cwdOrPath, name) : cwdOrPath).isDirectory();
  } catch {
    return false;
  }
};

export const isFile = (cwdOrPath: string, name?: string) => {
  try {
    return statSync(name ? join(cwdOrPath, name) : cwdOrPath).isFile();
  } catch {
    return false;
  }
};

export const findFile = (cwd: string, fileName: string) => {
  const filePath = join(cwd, fileName);
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

export const hasFileWithExtension = (cwd: string, dirName: string, extensions: string[]): boolean => {
  if (!isDirectory(cwd, dirName)) return false;

  try {
    for (const file of readdirSync(join(cwd, dirName))) {
      if (extensions.includes(extname(file))) return true;
    }
  } catch {}
  return false;
};

export const loadJSON = async (filePath: string) => {
  const contents = await loadFile(filePath);
  try {
    return JSON.parse(contents);
  } catch {
    return parseJSONC(filePath, contents);
  }
};

export const loadJSONC = async (filePath: string) => {
  const contents = await loadFile(filePath);
  return parseJSONC(filePath, contents);
};

export const loadYAML = async (filePath: string) => {
  const contents = await loadFile(filePath);
  return parseYAML(contents);
};

export const loadTOML = async (filePath: string) => {
  const contents = await loadFile(filePath);
  return parseTOML(contents);
};

export const parseJSONC = async (filePath: string, contents: string) => {
  try {
    return JSON.parse(stripJsonComments(contents, { trailingCommas: true, whitespace: false }));
  } catch (error) {
    const message = `Error parsing ${filePath} ${extname(filePath) === '.json5' ? 'JSON5 features beyond comments and trailing commas are not fully supported. Consider converting to .jsonc format.' : ''}`;
    throw new LoaderError(message, { cause: error });
  }
};

export const parseYAML = (contents: string) => {
  return yaml.load(contents);
};
