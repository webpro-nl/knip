import type { Fix } from './types/exports.ts';
import type { IssueSymbol, SymbolType } from './types/issues.ts';
import type { Export, ExportMember, Import, ImportGlob } from './types/module-graph.ts';

export type IdEntries = Array<[string, string[]]>;
export type NsEntries = Array<[string, IdEntries]>;
export interface WireImportMaps {
  refs: string[];
  enumerated?: string[];
  import: IdEntries;
  importAs: NsEntries;
  importNs: IdEntries;
  reExport: IdEntries;
  reExportNs: IdEntries;
  reExportAs: NsEntries;
}
export type WireImport = Omit<Import, 'filePath' | 'identifier' | 'alias' | 'jsDocTags'> & {
  filePath?: string;
  identifier?: string;
  alias?: string;
  jsDocTags?: Set<string>;
};
type WireMember = Omit<ExportMember, 'jsDocTags' | 'fix'> & {
  jsDocTags: Set<string>;
  fix?: Fix;
};
type WireExport = Omit<Export, 'jsDocTags' | 'referencedIn' | 'members'> & {
  jsDocTags: Set<string>;
  referencedIn?: string[];
  members: WireMember[];
};
type WireGlob = Omit<ImportGlob, 'filter'> & { filter?: [string, string] };
interface NativeFileWire {
  skipExports: boolean;
  internal: Array<[string, WireImportMaps]>;
  external: WireImport[];
  unresolved: WireImport[];
  imports: WireImport[];
  programFiles: string[];
  entryFiles: string[];
  exports: Array<[string, WireExport]>;
  duplicates: IssueSymbol[][];
  scripts: string[];
  importGlobs: WireGlob[];
}
export interface NativeFileCompact {
  strings: string[];
  data: Uint32Array;
}

const symbolTypes: SymbolType[] = [
  'class',
  'enum',
  'function',
  'interface',
  'member',
  'namespace',
  'type',
  'unknown',
  'variable',
];

export function decodeNativeFile({ strings, data }: NativeFileCompact, includeInternal = true): NativeFileWire {
  let offset = 0;
  const number = () => data[offset++];
  const boolean = () => number() === 1;
  const string = () => strings[number()];
  const array = <T>(read: () => T): T[] => {
    const length = number();
    const result: T[] = new Array(length);
    for (let index = 0; index < length; index++) result[index] = read();
    return result;
  };
  const stringArray = () => array(string);
  const tagSets = [new Set<string>()];
  const tags = () => {
    const id = number();
    return (tagSets[id] ??= new Set(stringArray()));
  };
  const ids = (): IdEntries => array((): [string, string[]] => [string(), stringArray()]);
  const namespaces = (): NsEntries => array((): [string, IdEntries] => [string(), ids()]);
  const maps = (): WireImportMaps => {
    const refs = stringArray();
    const enumerated = boolean() ? stringArray() : undefined;
    const result: WireImportMaps = {
      refs,
      import: ids(),
      importAs: namespaces(),
      importNs: ids(),
      reExport: ids(),
      reExportNs: ids(),
      reExportAs: namespaces(),
    };
    if (enumerated !== undefined) result.enumerated = enumerated;
    return result;
  };
  const importItem = (): WireImport => {
    const specifier = string();
    const filePath = boolean() ? string() : undefined;
    const identifier = boolean() ? string() : undefined;
    const alias = boolean() ? string() : undefined;
    const result: WireImport = {
      specifier,
      pos: number(),
      line: number(),
      col: number(),
      isTypeOnly: boolean(),
      modifiers: number(),
    };
    const jsDocTags = boolean() ? tags() : undefined;
    if (filePath !== undefined) result.filePath = filePath;
    if (identifier !== undefined) result.identifier = identifier;
    if (alias !== undefined) result.alias = alias;
    if (jsDocTags !== undefined) result.jsDocTags = jsDocTags;
    return result;
  };
  const fix = (): Exclude<Fix, undefined> => {
    if (number() !== 3) throw new Error('Invalid native fix tuple');
    return [number(), number(), number()];
  };
  const member = (): WireMember => {
    const identifier = string();
    const type = symbolTypes[number()];
    const pos = number();
    const line = number();
    const col = number();
    const memberFix = boolean() ? fix() : undefined;
    const result: WireMember = {
      identifier,
      type,
      pos,
      line,
      col,
      jsDocTags: tags(),
      flags: number(),
      hasRefsInFile: boolean(),
    };
    if (memberFix !== undefined) result.fix = memberFix;
    return result;
  };
  const exportItem = (): WireExport => {
    const identifier = string();
    const binding = string();
    const type = symbolTypes[number()];
    const pos = number();
    const line = number();
    const col = number();
    const members = array(member);
    const jsDocTags = tags();
    const hasRefsInFile = boolean();
    const isRegistered = boolean();
    const referencedIn = boolean() ? stringArray() : undefined;
    const result: WireExport = {
      identifier,
      binding,
      type,
      pos,
      line,
      col,
      members,
      jsDocTags,
      hasRefsInFile,
      isRegistered,
      fixes: array(fix),
      isReExport: boolean(),
      isBindingReExport: boolean(),
    };
    if (referencedIn !== undefined) result.referencedIn = referencedIn;
    return result;
  };
  const symbol = (): IssueSymbol => ({ symbol: string(), pos: number(), line: number(), col: number() });
  const glob = (): WireGlob => {
    const result: WireGlob = { patterns: stringArray() };
    if (boolean()) result.base = string();
    if (boolean()) result.cwd = string();
    if (boolean()) result.filter = [string(), string()];
    if (boolean()) result.analyzeExports = boolean();
    return result;
  };
  const skipStrings = () => {
    const length = number();
    offset += length;
  };
  const skipIds = () => {
    const length = number();
    for (let index = 0; index < length; index++) {
      offset++;
      skipStrings();
    }
  };
  const skipNamespaces = () => {
    const length = number();
    for (let index = 0; index < length; index++) {
      offset++;
      skipIds();
    }
  };
  const internal = (): NativeFileWire['internal'] => {
    if (includeInternal) return array((): [string, WireImportMaps] => [string(), maps()]);
    const length = number();
    for (let index = 0; index < length; index++) {
      offset++;
      skipStrings();
      if (boolean()) skipStrings();
      skipIds();
      skipNamespaces();
      skipIds();
      skipIds();
      skipIds();
      skipNamespaces();
    }
    return [];
  };
  const result: NativeFileWire = {
    skipExports: boolean(),
    internal: internal(),
    external: array(importItem),
    unresolved: array(importItem),
    imports: array(importItem),
    programFiles: stringArray(),
    entryFiles: stringArray(),
    exports: array((): [string, WireExport] => [string(), exportItem()]),
    duplicates: array(() => array(symbol)),
    scripts: stringArray(),
    importGlobs: array(glob),
  };
  if (offset !== data.length) throw new Error('Invalid native analyzer data length');
  return result;
}
