import type { Import, ModuleGraph } from '../types/module-graph.js';
import type { UsageResult } from './operations/get-usage.js';
import type { DefinitionResult } from './operations/resolve-definition.js';

interface ExplorerCache {
  definitions: Map<string, Map<string, DefinitionResult | null>>;
  usage: Map<string, Map<string, UsageResult>>;
  importLookup: Map<string, Map<string, Map<string, Import>>>;
  exportedIdentifiers: Map<string, Map<string, boolean>>;
  generation: number;
}

const caches = new WeakMap<ModuleGraph, ExplorerCache>();

const createEmptyCache = (): ExplorerCache => ({
  definitions: new Map(),
  usage: new Map(),
  importLookup: new Map(),
  exportedIdentifiers: new Map(),
  generation: 0,
});

const getCache = (graph: ModuleGraph): ExplorerCache => {
  let cache = caches.get(graph);
  if (!cache) {
    cache = createEmptyCache();
    caches.set(graph, cache);
  }
  return cache;
};

export const invalidateCache = (graph: ModuleGraph): void => {
  const cache = caches.get(graph);
  if (cache) {
    cache.definitions.clear();
    cache.usage.clear();
    cache.importLookup.clear();
    cache.exportedIdentifiers.clear();
    cache.generation++;
  }
};

export const getCachedDefinition = (
  graph: ModuleGraph,
  filePath: string,
  identifier: string
): DefinitionResult | null | undefined => {
  const cache = caches.get(graph);
  if (!cache) return undefined;
  const fileCache = cache.definitions.get(filePath);
  if (!fileCache) return undefined;
  return fileCache.has(identifier) ? fileCache.get(identifier) : undefined;
};

export const setCachedDefinition = (
  graph: ModuleGraph,
  filePath: string,
  identifier: string,
  result: DefinitionResult | null
): void => {
  const cache = getCache(graph);
  let fileCache = cache.definitions.get(filePath);
  if (!fileCache) {
    fileCache = new Map();
    cache.definitions.set(filePath, fileCache);
  }
  fileCache.set(identifier, result);
};

export const getCachedUsage = (graph: ModuleGraph, filePath: string, identifier: string): UsageResult | undefined => {
  const cache = caches.get(graph);
  if (!cache) return undefined;
  const fileCache = cache.usage.get(filePath);
  if (!fileCache) return undefined;
  return fileCache.get(identifier);
};

export const setCachedUsage = (graph: ModuleGraph, filePath: string, identifier: string, result: UsageResult): void => {
  const cache = getCache(graph);
  let fileCache = cache.usage.get(filePath);
  if (!fileCache) {
    fileCache = new Map();
    cache.usage.set(filePath, fileCache);
  }
  fileCache.set(identifier, result);
};

export const getCachedExportedIdentifiers = (
  graph: ModuleGraph,
  filePath: string
): Map<string, boolean> | undefined => {
  const cache = caches.get(graph);
  if (!cache) return undefined;
  return cache.exportedIdentifiers.get(filePath);
};

export const setCachedExportedIdentifiers = (
  graph: ModuleGraph,
  filePath: string,
  result: Map<string, boolean>
): void => {
  const cache = getCache(graph);
  cache.exportedIdentifiers.set(filePath, result);
};
