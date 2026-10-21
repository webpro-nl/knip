import { createRequire, isBuiltin } from 'node:module';
import type { NativeModuleResolver } from './native-module-resolver.ts';
import { pathStringsLossy } from './native-resolver-cache.ts';
import { rawComments, wasiParser } from './native.ts';
import { resolve } from './util/path.ts';
import {
  decodeNativeFile,
  type IdEntries,
  type NativeFileCompact,
  type NsEntries,
  type WireImport,
  type WireImportMaps,
} from './native-analyzer-wire.ts';
import type { GetImportsAndExportsOptions, IgnoreExportsUsedInFile } from './types/config.ts';
import type { Export, ExportMember, FileNode, Import, ImportGlob, ImportMaps } from './types/module-graph.ts';
import type { ResolveModule } from './typescript/ast-nodes.ts';
import {
  getPackageNameFromFilePath,
  getPackageNameFromModuleSpecifier,
  isStartsLikePackageName,
  sanitizeSpecifier,
} from './util/modules.ts';
import { isInNodeModules } from './util/path.ts';

export type NativeVisitorId =
  | 'bun-shell'
  | 'jest'
  | 'vitest'
  | 'rstest'
  | 'vite'
  | 'webpack'
  | 'rspack'
  | 'node'
  | 'execa'
  | 'nano-spawn'
  | 'zx'
  | 'knex'
  | 'pino'
  | 'lit'
  | 'fast'
  | 'catalyst'
  | 'stencil-custom-elements'
  | 'stencil-style-urls'
  | 'angular-style-urls';

export type NativeVisitorPlan = readonly NativeVisitorId[];
interface NativeResolution {
  kind: 'builtin' | 'resolved' | 'unresolved';
  resolvedFileName?: string;
  isExternalLibraryImport?: boolean;
  externalSpecifier?: string;
}
export interface NativeOptions extends GetImportsAndExportsOptions {
  skipExportsForFile: boolean;
  includeLocalRefs: boolean;
  countRefTypes: string[];
  plugins: NativeVisitorPlan;
  pathStringsLossy: boolean;
  rawComments?: boolean;
  wasiParser?: boolean;
  cwd: string;
}
interface Binding {
  analyzeFile: (
    filePath: string,
    sourceText: string,
    options: NativeOptions,
    resolve: (specifier: string, resolveBuiltin: boolean) => NativeResolution,
    validateRegExp: (pattern: string, flags: string) => void
  ) => NativeFileCompact;
}
const require = createRequire(import.meta.url);
const binding: Binding = require('knip/native');
const nativeFiles = new WeakMap<FileNode, NativeFileCompact>();

export const getNativeFileData = (file: FileNode) => nativeFiles.get(file);
export const takeNativeFileData = (file: FileNode) => {
  const data = nativeFiles.get(file);
  nativeFiles.delete(file);
  return data;
};

const idMap = (entries: IdEntries) => {
  const map = new Map<string, Set<string>>();
  for (const [id, values] of entries) map.set(id, new Set(values));
  return map;
};
const nsMap = (entries: NsEntries) => {
  const map = new Map<string, Map<string, Set<string>>>();
  for (const [id, values] of entries) map.set(id, idMap(values));
  return map;
};
const importMaps = (item: WireImportMaps): ImportMaps => ({
  refs: new Set(item.refs),
  enumerated: item.enumerated == null ? undefined : new Set(item.enumerated),
  import: idMap(item.import),
  importAs: nsMap(item.importAs),
  importNs: idMap(item.importNs),
  reExport: idMap(item.reExport),
  reExportAs: nsMap(item.reExportAs),
  reExportNs: idMap(item.reExportNs),
});
const importSet = (items: WireImport[]) => {
  const result = new Set<Import>();
  for (const item of items) {
    result.add({
      filePath: item.filePath ?? undefined,
      specifier: item.specifier,
      identifier: item.identifier ?? undefined,
      alias: item.alias ?? undefined,
      pos: item.pos,
      line: item.line,
      col: item.col,
      isTypeOnly: item.isTypeOnly,
      modifiers: item.modifiers,
      jsDocTags: item.jsDocTags,
    });
  }
  return result;
};

export function createNativeOptions(
  options: GetImportsAndExportsOptions,
  ignoreExportsUsedInFile: IgnoreExportsUsedInFile,
  skipExportsForFile: boolean,
  visitorPlan: NativeVisitorPlan = ['bun-shell']
): NativeOptions {
  const countRefTypes: string[] = [];
  if (ignoreExportsUsedInFile === true) countRefTypes.push('*');
  else if (typeof ignoreExportsUsedInFile === 'object') {
    for (const [type, enabled] of Object.entries(ignoreExportsUsedInFile))
      if (enabled && type !== 'unknown') countRefTypes.push(type);
  }
  return {
    ...options,
    skipExportsForFile,
    includeLocalRefs: !!ignoreExportsUsedInFile,
    countRefTypes,
    plugins: visitorPlan,
    pathStringsLossy,
    rawComments,
    wasiParser,
    cwd: resolve(),
  };
}

function getImportsAndExports(
  filePath: string,
  sourceText: string,
  resolveModule: ResolveModule | NativeModuleResolver,
  options: GetImportsAndExportsOptions,
  ignoreExportsUsedInFile: IgnoreExportsUsedInFile,
  skipExportsForFile: boolean,
  visitorPlan: NativeVisitorPlan = ['bun-shell'],
  includeInternal = true
): FileNode {
  if (typeof resolveModule === 'function' && typeof binding.analyzeFile !== 'function')
    throw new Error('Native per-file analyzer is unavailable. Rebuild the native addon.');
  let callbackThrew = false;
  let callbackError: unknown;
  let filters: RegExp[] | undefined;
  let compact: NativeFileCompact;
  const nativeOptions = createNativeOptions(options, ignoreExportsUsedInFile, skipExportsForFile, visitorPlan);
  const validate = (pattern: string, flags: string) => {
    try {
      (filters ??= []).push(new RegExp(pattern, flags));
    } catch (error) {
      if (!callbackThrew) {
        callbackThrew = true;
        callbackError = error;
      }
      throw error instanceof Error ? error : new Error('Regular expression validation failed');
    }
  };
  try {
    compact =
      typeof resolveModule !== 'function'
        ? resolveModule.analyzeFile(filePath, sourceText, nativeOptions, validate)
        : binding.analyzeFile(
            filePath,
            sourceText,
            nativeOptions,
            (specifier, resolveBuiltin) => {
              try {
                const builtin = isBuiltin(specifier);
                if (builtin && !resolveBuiltin) return { kind: 'builtin' };
                const module = resolveModule(specifier, filePath);
                if (!module) return { kind: builtin ? 'builtin' : 'unresolved' };
                let externalSpecifier: string | undefined;
                if (module.isExternalLibraryImport) {
                  let sanitized = sanitizeSpecifier(
                    isInNodeModules(specifier) ? getPackageNameFromFilePath(specifier) : specifier
                  );
                  if (
                    module.packageName &&
                    isStartsLikePackageName(module.packageName) &&
                    getPackageNameFromModuleSpecifier(sanitized) !== module.packageName
                  ) {
                    sanitized = module.packageName;
                  }
                  if (isStartsLikePackageName(sanitized)) externalSpecifier = sanitized;
                }
                return {
                  kind: builtin ? 'builtin' : 'resolved',
                  resolvedFileName: module.resolvedFileName,
                  isExternalLibraryImport: module.isExternalLibraryImport,
                  externalSpecifier,
                };
              } catch (error) {
                if (!callbackThrew) {
                  callbackThrew = true;
                  callbackError = error;
                }
                throw error instanceof Error ? error : new Error('Module resolution failed');
              }
            },
            validate
          );
  } catch (error) {
    if (callbackThrew) throw callbackError;
    throw error;
  }
  return createNativeFile(compact, filters, includeInternal);
}

export function createNativeFile(compact: NativeFileCompact, filters?: RegExp[], includeInternal = true): FileNode {
  const wire = decodeNativeFile(compact, includeInternal);
  const internal = new Map<string, ImportMaps>();
  for (const [path, maps] of wire.internal) internal.set(path, importMaps(maps));
  const exports = new Map<string, Export>();
  for (const [name, item] of wire.exports) {
    const members: ExportMember[] = [];
    for (const member of item.members) members.push({ ...member, fix: member.fix ?? undefined });
    exports.set(name, {
      ...item,
      members,
      referencedIn: item.referencedIn == null ? undefined : new Set(item.referencedIn),
    });
  }
  const importGlobs: ImportGlob[] = [];
  let filterIndex = 0;
  for (const item of wire.importGlobs) {
    const glob: ImportGlob = { patterns: item.patterns };
    if (item.base != null) glob.base = item.base;
    if (item.cwd != null) glob.cwd = item.cwd;
    if (item.filter != null) {
      const filter = filters === undefined ? new RegExp(item.filter[0], item.filter[1]) : filters[filterIndex++];
      if (!filter) throw new Error('Native regular expression validation is unavailable. Rebuild the native addon.');
      glob.filter = filter;
    } else if (item.base != null) glob.filter = undefined;
    if (item.analyzeExports != null) glob.analyzeExports = item.analyzeExports;
    importGlobs.push(glob);
  }
  const file: FileNode = {
    skipExports: wire.skipExports,
    imports: {
      internal,
      external: importSet(wire.external),
      externalRefs: new Set(),
      programFiles: new Set(wire.programFiles),
      entryFiles: new Set(wire.entryFiles),
      imports: importSet(wire.imports),
      unresolved: importSet(wire.unresolved),
    },
    exports,
    duplicates: wire.duplicates,
    scripts: new Set(wire.scripts),
    importGlobs,
    importedBy: undefined,
    internalImportCache: undefined,
  };
  nativeFiles.set(file, compact);
  return file;
}

export function nativeGetImportsAndExports(
  filePath: string,
  sourceText: string,
  resolveModule: ResolveModule,
  options: GetImportsAndExportsOptions,
  ignoreExportsUsedInFile: IgnoreExportsUsedInFile,
  skipExportsForFile: boolean,
  visitorPlan: NativeVisitorPlan = ['bun-shell']
): FileNode {
  return getImportsAndExports(
    filePath,
    sourceText,
    resolveModule,
    options,
    ignoreExportsUsedInFile,
    skipExportsForFile,
    visitorPlan
  );
}

export function nativeGetImportsAndExportsWithResolver(
  filePath: string,
  sourceText: string,
  resolveModule: NativeModuleResolver,
  options: GetImportsAndExportsOptions,
  ignoreExportsUsedInFile: IgnoreExportsUsedInFile,
  skipExportsForFile: boolean,
  visitorPlan: NativeVisitorPlan = ['bun-shell'],
  includeInternal = true
): FileNode {
  return getImportsAndExports(
    filePath,
    sourceText,
    resolveModule,
    options,
    ignoreExportsUsedInFile,
    skipExportsForFile,
    visitorPlan,
    includeInternal
  );
}
