// Borrowed from https://github.com/npm/package-json + https://github.com/npm/json-parse-even-better-errors
import { readFile, writeFile } from 'node:fs/promises';
import { IS_DTS } from '../constants.ts';
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

const declarationExtensionMap = new Map([
  ['.js', '.d.ts'],
  ['.mjs', '.d.mts'],
  ['.cjs', '.d.cts'],
]);

export const toDeclarationSpecifier = (specifier: string) => {
  for (const [extension, declarationExtension] of declarationExtensionMap) {
    if (specifier.endsWith(extension)) return specifier.slice(0, -extension.length) + declarationExtension;
  }
  if (IS_DTS.test(specifier)) return specifier;
};

export const getPublishedTypeManifest = (manifest: PackageJson) => {
  const { publishConfig } = manifest;
  if (!publishConfig) return manifest;

  const publishedManifest = { ...manifest };
  if (Object.hasOwn(publishConfig, 'main')) publishedManifest.main = publishConfig.main;
  if (Object.hasOwn(publishConfig, 'exports')) publishedManifest.exports = publishConfig.exports;
  if (Object.hasOwn(publishConfig, 'types')) publishedManifest.types = publishConfig.types;
  if (Object.hasOwn(publishConfig, 'typings')) publishedManifest.typings = publishConfig.typings;
  if (Object.hasOwn(publishConfig, 'typesVersions')) publishedManifest.typesVersions = publishConfig.typesVersions;
  return publishedManifest;
};

const isLocalTypeTarget = (target: string) =>
  !target.startsWith('/') && !target.split('/').some(segment => segment === '..' || segment === 'node_modules');

const collectPublishedTypeTargets = (value: unknown, targets: Set<string>) => {
  if (typeof value === 'string') {
    const specifier = toDeclarationSpecifier(value);
    if (specifier && isLocalTypeTarget(specifier)) targets.add(specifier);
    return;
  }
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const child of value) collectPublishedTypeTargets(child, targets);
    return;
  }

  const children = Object.entries(value);
  const typeConditions = children.filter(([condition]) => condition === 'types' || condition.startsWith('types@'));
  for (const [, child] of typeConditions.length > 0 ? typeConditions : children)
    collectPublishedTypeTargets(child, targets);
};

export const getPublishedTypeExportSpecifiers = (exports: PackageJson['exports']) => {
  const specifiers = new Set<string>();
  if (exports) collectPublishedTypeTargets(exports, specifiers);
  return specifiers;
};

export const getPublishedTypeEntrySpecifiers = (manifest: PackageJson) => {
  const versioned = new Set<string>();
  if (manifest.typesVersions) {
    for (const paths of Object.values(manifest.typesVersions)) {
      for (const targets of Object.values(paths)) {
        if (!Array.isArray(targets)) continue;
        for (const target of targets) {
          if (typeof target === 'string' && isLocalTypeTarget(target)) versioned.add(target);
        }
      }
    }
  }

  const candidates: string[] = [];
  for (const field of [manifest.types, manifest.typings, manifest.main]) {
    if (typeof field !== 'string') continue;
    const specifier = toDeclarationSpecifier(field);
    if (specifier && isLocalTypeTarget(specifier) && !candidates.includes(specifier)) candidates.push(specifier);
  }
  if (!candidates.includes('index.d.ts')) candidates.push('index.d.ts');

  return { candidates, versioned };
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

const matchPublishedTypeTarget = (pattern: string, candidate: string) => {
  const parts = pattern.split('*');
  if (parts.length === 1) return pattern === candidate ? { patternMatch: undefined } : undefined;
  const starCount = parts.length - 1;
  const matchLength = (candidate.length - pattern.length + starCount) / starCount;
  if (matchLength < 0 || !Number.isInteger(matchLength)) return;
  const patternMatch = candidate.slice(parts[0].length, parts[0].length + matchLength);
  if (parts.join(patternMatch) === candidate) return { patternMatch };
};

const getExportEntries = (exports: NonNullable<PackageJson['exports']>) => {
  if (!Array.isArray(exports) && typeof exports === 'object') {
    const entries = Object.entries(exports);
    if (entries.some(([key]) => key.startsWith('.'))) return entries.filter(([key]) => key.startsWith('.'));
  }
  return [['.', exports] as const];
};

export const isPublishedTypeExportTarget = (exports: PackageJson['exports'], candidate: string) => {
  if (!exports) return false;
  for (const [subpath, target] of getExportEntries(exports)) {
    for (const pattern of getPublishedTypeExportSpecifiers(target)) {
      const match = matchPublishedTypeTarget(pattern, candidate);
      if (!match) continue;
      const publicSubpath = match.patternMatch === undefined ? subpath : subpath.replaceAll('*', match.patternMatch);
      const resolved = getPackageMapTarget(exports, publicSubpath);
      if (!resolved) continue;
      for (const selected of getPublishedTypeExportSpecifiers(resolved.target)) {
        if (matchPublishedTypeTarget(selected, candidate)) return true;
      }
    }
  }
  return false;
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
