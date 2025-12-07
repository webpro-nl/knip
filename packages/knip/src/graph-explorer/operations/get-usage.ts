import type { Identifier, ModuleGraph, Position } from '../../types/module-graph.js';
import { getCachedUsage, setCachedUsage } from '../cache.js';
import { CONTINUE } from '../constants.js';
import { findImportRef } from '../utils.js';
import { type Via, walkDown } from '../walk-down.js';

export interface UsageLocation extends Position {
  filePath: string;
  identifier: string;
  isEntry: boolean;
  via: Via;
}

export interface UsageResult {
  locations: UsageLocation[];
  reExportingEntryFile: string | undefined;
}

export const getUsage = (
  graph: ModuleGraph,
  entryPaths: Set<string>,
  filePath: string,
  identifier: Identifier
): UsageResult => {
  const cached = getCachedUsage(graph, filePath, identifier);
  if (cached) return cached;

  const locations: UsageLocation[] = [];
  let reExportingEntryFile: string | undefined;

  if (entryPaths.has(filePath)) {
    reExportingEntryFile = filePath;
  }

  walkDown(
    graph,
    filePath,
    identifier,
    (sourceFile, _sourceId, importingFile, id, isEntry, via) => {
      const importRef = findImportRef(graph, importingFile, sourceFile, id);
      locations.push({
        filePath: importingFile,
        identifier: id,
        pos: importRef?.pos ?? 0,
        line: importRef?.line ?? 0,
        col: importRef?.col ?? 0,
        isEntry,
        via,
      });

      if (isEntry && !reExportingEntryFile) reExportingEntryFile = importingFile;

      return CONTINUE;
    },
    entryPaths
  );

  const result: UsageResult = { locations, reExportingEntryFile };
  setCachedUsage(graph, filePath, identifier, result);
  return result;
};
