// Borrowed from https://github.com/npm/package-json + https://github.com/npm/json-parse-even-better-errors
import { readFile, writeFile } from 'node:fs/promises';
import type { PackageJson } from '../types/package-json.js';
import { _glob } from './glob.js';
import { getStringValues } from './object.js';

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

export const getEntryPathsFromManifest = (
  manifest: PackageJson,
  sharedGlobOptions: { cwd: string; dir: string; gitignore: boolean; ignore: string[] }
) => {
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
    for (const item of getStringValues(exports)) entryPaths.add(item);
  }

  if (typeof types === 'string') entryPaths.add(types);
  if (typeof typings === 'string') entryPaths.add(typings);

  // Use glob, as we only want source files that:
  // - exist
  // - are not (generated) files that are .gitignore'd
  // - do not match configured `ignore` patterns
  return _glob({ ...sharedGlobOptions, patterns: Array.from(entryPaths), label: 'package.json entry' });
};
