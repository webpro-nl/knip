// Borrowed from https://github.com/npm/package-json + https://github.com/npm/json-parse-even-better-errors
import { readFile, writeFile } from 'node:fs/promises';
import type { PackageJson } from '../types/package-json.js';

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
