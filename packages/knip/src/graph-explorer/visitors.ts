/** biome-ignore-all lint/suspicious/noConfusingVoidType: avoid */
import { IMPORT_STAR } from '../constants.js';
import type { ImportMaps } from '../types/module-graph.js';

type PassThroughReExportCallback = (identifier: string, sources: Set<string>) => boolean | void;

type AliasReExportCallback = (identifier: string, alias: string, sources: Set<string>) => boolean | void;

type NamespaceReExportCallback = (namespace: string, sources: Set<string>) => boolean | void;

export const forEachPassThroughReExport = (importMaps: ImportMaps, callback: PassThroughReExportCallback): boolean => {
  for (const [identifier, sources] of importMaps.reExported) {
    if (identifier === IMPORT_STAR) continue;
    if (callback(identifier, sources ?? new Set()) === false) return false;
  }
  return true;
};

export const forEachAliasReExport = (importMaps: ImportMaps, callback: AliasReExportCallback): boolean => {
  for (const [identifier, aliasMap] of importMaps.reExportedAs) {
    for (const [alias, sources] of aliasMap) {
      if (callback(identifier, alias, sources ?? new Set()) === false) return false;
    }
  }
  return true;
};

export const forEachNamespaceReExport = (importMaps: ImportMaps, callback: NamespaceReExportCallback): boolean => {
  for (const [namespace, sources] of importMaps.reExportedNs) {
    if (callback(namespace, sources ?? new Set()) === false) return false;
  }
  return true;
};

export const getStarReExportSources = (importMaps: ImportMaps) => importMaps.reExported.get(IMPORT_STAR);

export const getPassThroughReExportSources = (importMaps: ImportMaps, identifier: string) =>
  importMaps.reExported.get(identifier);

export const getAliasReExportMap = (importMaps: ImportMaps, identifier: string) =>
  importMaps.reExportedAs.get(identifier);

export const getNamespaceReExportSources = (importMaps: ImportMaps, namespace: string) =>
  importMaps.reExportedNs.get(namespace);
