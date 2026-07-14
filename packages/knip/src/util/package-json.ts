// Borrowed from https://github.com/npm/package-json + https://github.com/npm/json-parse-even-better-errors
import { readFile, writeFile } from 'node:fs/promises';
import type { PackageJson } from '../types/package-json.ts';

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
      if (prop !== '.') values.push(`!${prop}`);
    } else if (typeof obj[prop] === 'object') {
      values = values.concat(getEntriesFromExports(obj[prop]));
    }
  }
  return values;
};

export const getPackageMapTarget = (map: unknown, key: string) => {
  if (!map || typeof map !== 'object' || Array.isArray(map)) return key === '.' ? { target: map } : undefined;

  const entries = Object.entries(map);
  let hasSubpaths = false;
  for (const [subpath, target] of entries) {
    if (!subpath.startsWith('.') && !subpath.startsWith('#')) continue;
    hasSubpaths = true;
    if (subpath === key) return { target };
  }
  if (!hasSubpaths) return key === '.' ? { target: map } : undefined;

  let best: { target: unknown; patternMatch: string; prefixLength: number; subpathLength: number } | undefined;
  for (const [subpath, target] of entries) {
    const starIndex = subpath.indexOf('*');
    if (starIndex < 0) continue;
    const prefix = subpath.slice(0, starIndex);
    const suffix = subpath.slice(starIndex + 1);
    if (!key.startsWith(prefix) || !key.endsWith(suffix) || key.length < prefix.length + suffix.length) continue;
    if (
      !best ||
      prefix.length > best.prefixLength ||
      (prefix.length === best.prefixLength && subpath.length > best.subpathLength)
    ) {
      best = {
        target,
        patternMatch: key.slice(prefix.length, key.length - suffix.length),
        prefixLength: prefix.length,
        subpathLength: subpath.length,
      };
    }
  }
  if (best) return { target: best.target, patternMatch: best.patternMatch };
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

export const getEntrySpecifiersFromManifest = (manifest: PackageJson) => {
  const { main, module, browser, bin, exports, types, typings } = manifest;

  const entryPaths = new Set<string>();

  if (typeof main === 'string' && main) entryPaths.add(main);
  if (typeof module === 'string' && module) entryPaths.add(module);
  if (typeof browser === 'string' && browser) entryPaths.add(browser);
  if (typeof bin === 'string' && bin) entryPaths.add(bin);
  if (bin && typeof bin === 'object') for (const id of Object.values(bin)) if (id) entryPaths.add(id);
  if (typeof types === 'string' && types) entryPaths.add(types);
  if (typeof typings === 'string' && typings) entryPaths.add(typings);

  if (exports) {
    for (const item of getEntriesFromExports(exports)) {
      if (item === './*' || item.trim() === '') continue;
      const expanded = item
        .replace(/\/\*$/, '/**') // /* → /**
        .replace(/\/\*\./, '/**/*.') // /*. → /**/*.
        .replace(/\/\*\//, '/**/'); // /*/ → /**/
      entryPaths.add(expanded);
    }
  }

  if (manifest.imports) {
    for (const [key, value] of Object.entries(manifest.imports)) {
      if (!key.startsWith('#')) continue;
      for (const item of getEntriesFromExports(value)) {
        if (item.startsWith('.') && !item.includes('*')) entryPaths.add(item);
      }
    }
  }

  return entryPaths;
};

export type Manifest = PackageJson & {
  scriptNames: Set<string>;
  getMajor: (name: string) => number | undefined;
};

export const createManifest = (raw: PackageJson): Manifest =>
  Object.assign(raw, {
    ...raw,
    scriptNames: new Set(Object.keys(raw.scripts ?? {})),
    getMajor(name: string) {
      const range = raw.dependencies?.[name] ?? raw.devDependencies?.[name];
      const match = range?.match(/\d+/)?.[0];
      return match ? Number.parseInt(match, 10) : undefined;
    },
  });

export const getManifestImportDependencies = (manifest: PackageJson) => {
  const dependencies = new Set<string>();
  if (!manifest.imports) return dependencies;
  for (const [entry, exportValue] of Object.entries(manifest.imports)) {
    if (!entry.startsWith('#')) continue;
    for (const item of getEntriesFromExports(exportValue)) {
      if (!item.startsWith('.') && !item.startsWith('!')) dependencies.add(item);
    }
  }
  return dependencies;
};
