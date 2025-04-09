// Borrowed from https://github.com/npm/package-json + https://github.com/npm/json-parse-even-better-errors
import { readFile, writeFile } from 'node:fs/promises';
import type { PackageJson } from '../types/package-json.js';
import { _glob } from './glob.js';

const INDENT = Symbol.for('indent');
const NEWLINE = Symbol.for('newline');
const DEFAULT_NEWLINE = '\n';
const DEFAULT_INDENT = '  ';
const BOM = /^\uFEFF/;
const FORMAT = /^\s*[{[]((?:\r?\n)+)([\s\t]*)/;
const EMPTY = /^(?:\{\}|\[\])((?:\r?\n)+)?$/;

interface ExtendedPackageJson extends PackageJson {
  [INDENT]?: string;
  [NEWLINE]?: string;
}

const stripBOM = (txt: string) => String(txt).replace(BOM, '');

const parseJson = (raw: string): ExtendedPackageJson => {
  const txt = stripBOM(raw);
  const result = JSON.parse(txt);
  if (result && typeof result === 'object') {
    const match = txt.match(EMPTY) || txt.match(FORMAT) || [null, '', ''];
    result[NEWLINE] = match[1] ?? DEFAULT_NEWLINE;
    result[INDENT] = match[2] ?? DEFAULT_INDENT;
  }
  return result;
};

const getEntriesFromExports = (obj: any): string[] => {
  if (typeof obj === 'string') return [obj];
  let values: string[] = [];
  for (const prop in obj) {
    if (typeof obj[prop] === 'string') {
      values.push(obj[prop]);
    } else if (obj[prop] === null) {
      values.push(`!${prop}`);
    } else if (typeof obj[prop] === 'object') {
      values = values.concat(getEntriesFromExports(obj[prop]));
    }
  }
  return values;
};

export const load = async (filePath: string) => {
  const file = await readFile(filePath, 'utf8');
  return parseJson(file);
};

export const save = async (filePath: string, content: ExtendedPackageJson) => {
  const { [INDENT]: indent, [NEWLINE]: newline } = content;
  const space = indent === undefined ? DEFAULT_INDENT : indent;
  const EOL = newline === undefined ? DEFAULT_NEWLINE : newline;
  const fileContent = `${JSON.stringify(content, null, space)}\n`.replace(/\n/g, EOL);
  await writeFile(filePath, fileContent);
};

export const getEntryPathsFromManifest = (manifest: PackageJson, options: { cwd: string; ignore: string[] }) => {
  const { main, module, browser, bin, exports, types, typings } = manifest;

  const entryPaths = new Set<string>();

  if (typeof main === 'string') entryPaths.add(main);

  if (typeof module === 'string') entryPaths.add(module);

  if (typeof browser === 'string') entryPaths.add(browser);

  if (bin) {
    if (typeof bin === 'string') entryPaths.add(bin);
    if (typeof bin === 'object') for (const id of Object.values(bin)) entryPaths.add(id);
  }

  if (exports) {
    for (const item of getEntriesFromExports(exports)) {
      if (item === './*') continue;
      const expanded = item
        .replace(/\/\*$/, '/**') // /* → /**
        .replace(/\/\*\./, '/**/*.') // /*. → /**/*.
        .replace(/\/\*\//, '/**/'); // /*/ → /**/
      entryPaths.add(expanded);
    }
  }

  if (typeof types === 'string') entryPaths.add(types);
  if (typeof typings === 'string') entryPaths.add(typings);

  return _glob({ patterns: Array.from(entryPaths), ...options, gitignore: false, label: 'package.json entry paths' });
};
