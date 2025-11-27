import type { ModuleGraph } from '../types/module-graph.js';
import { STOP } from './constants.js';
import { hasNamespaceMemberReference } from './utils.js';
import { getAliasReExportMap, getPassThroughReExportSources, getStarReExportSources } from './visitors.js';

type Visitor = (
  sourceFile: string,
  identifier: string,
  importingFile: string,
  identifierPath: string,
  isEntry: boolean,
  isReExport: boolean
) => 'continue' | 'stop' | undefined;

export const walkDown = (
  graph: ModuleGraph,
  filePath: string,
  identifier: string,
  visitor: Visitor,
  entryPaths: Set<string>,
  visited: Set<string> = new Set()
): boolean => {
  const key = `${filePath}:${identifier}`;
  if (visited.has(key)) return false;
  visited.add(key);

  const file = graph.get(filePath);
  if (!file?.imported) return false;

  const restIds = identifier.split('.');
  const id = restIds.shift();
  if (!id) return false;

  const imported = file.imported;

  const importedByFiles = imported.imported.get(id);
  if (importedByFiles) {
    for (const importingFile of importedByFiles) {
      const isEntry = entryPaths.has(importingFile);
      if (visitor(filePath, id, importingFile, id, isEntry, false) === STOP) return true;
    }
  }

  const importedAsAliases = imported.importedAs.get(id);
  if (importedAsAliases) {
    for (const [alias, byFilePaths] of importedAsAliases) {
      for (const importingFile of byFilePaths) {
        const isEntry = entryPaths.has(importingFile);
        if (visitor(filePath, id, importingFile, alias, isEntry, false) === STOP) return true;
      }
    }
  }

  for (const [namespace, byFilePaths] of imported.importedNs) {
    for (const importingFile of byFilePaths) {
      if (hasNamespaceMemberReference(graph, importingFile, filePath, namespace, identifier) === false) continue;
      const isEntry = entryPaths.has(importingFile);
      if (visitor(filePath, identifier, importingFile, `${namespace}.${identifier}`, isEntry, false) === STOP) {
        return true;
      }
    }
  }

  let done = false;

  if (!done) {
    const passThroughSources = getPassThroughReExportSources(imported, id);
    if (passThroughSources) {
      for (const reExportingFile of passThroughSources) {
        const isEntry = entryPaths.has(reExportingFile);
        if (visitor(filePath, id, reExportingFile, id, isEntry, true) === STOP) {
          done = true;
          break;
        }
        if (!isEntry && walkDown(graph, reExportingFile, identifier, visitor, entryPaths, visited)) {
          done = true;
          break;
        }
      }
    }
  }

  if (!done) {
    const aliasReExportMap = getAliasReExportMap(imported, id);
    if (aliasReExportMap) {
      for (const [alias, sources] of aliasReExportMap) {
        for (const reExportingFile of sources) {
          const isEntry = entryPaths.has(reExportingFile);
          if (visitor(filePath, id, reExportingFile, alias, isEntry, true) === STOP) {
            done = true;
            break;
          }
          if (!isEntry) {
            const ref = [alias, ...restIds].join('.');
            if (walkDown(graph, reExportingFile, ref, visitor, entryPaths, visited)) {
              done = true;
              break;
            }
          }
        }
        if (done) break;
      }
    }
  }

  if (!done) {
    for (const [namespace, sources] of imported.reExportedNs) {
      for (const reExportingFile of sources) {
        const isEntry = entryPaths.has(reExportingFile);
        if (visitor(filePath, identifier, reExportingFile, `${namespace}.${identifier}`, isEntry, true) === STOP) {
          done = true;
          break;
        }
        if (!isEntry && walkDown(graph, reExportingFile, `${namespace}.${identifier}`, visitor, entryPaths, visited)) {
          done = true;
          break;
        }
      }
      if (done) break;
    }
  }

  if (!done) {
    const starSources = getStarReExportSources(imported);
    if (starSources) {
      for (const reExportingFile of starSources) {
        const isEntry = entryPaths.has(reExportingFile);
        if (visitor(filePath, id, reExportingFile, id, isEntry, true) === STOP) {
          done = true;
          break;
        }
        if (!isEntry && walkDown(graph, reExportingFile, identifier, visitor, entryPaths, visited)) {
          done = true;
          break;
        }
      }
    }
  }

  return done;
};
