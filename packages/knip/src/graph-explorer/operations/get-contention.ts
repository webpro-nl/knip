import { IMPORT_STAR } from '../../constants.js';
import type { ContentionDetails } from '../../session/types.js';
import type { ModuleGraph } from '../../types/module-graph.js';
import { getExportedIdentifiers } from '../utils.js';
import { forEachAliasReExport, forEachPassThroughReExport, getStarReExportSources } from '../visitors.js';

interface ReExportNetwork {
  files: Set<string>;
  definitions: Set<string>;
  reExportsFrom: Map<string, Set<string>>;
}

export const getContention = (graph: ModuleGraph, filePath: string): Map<string, ContentionDetails> => {
  const node = graph.get(filePath);
  if (!node) return new Map();

  const exportedIdentifiers = getExportedIdentifiers(graph, filePath);
  const result = new Map<string, ContentionDetails>();

  for (const identifier of exportedIdentifiers.keys()) {
    if (identifier === 'default') continue;
    const details = getContentionForIdentifier(graph, filePath, identifier);
    if (details && (details.branching.length > 0 || details.conflict.length > 0)) {
      result.set(identifier, details);
    }
  }

  return result;
};

const getContentionForIdentifier = (
  graph: ModuleGraph,
  startFilePath: string,
  identifier: string
): ContentionDetails | null => {
  const network = buildReExportNetwork(graph, startFilePath, identifier);

  if (network.files.size <= 1) return null;

  const branchingFiles: string[] = [];
  for (const file of network.files) {
    const sourceCount = network.reExportsFrom.get(file)?.size ?? 0;
    if (sourceCount > 1) {
      branchingFiles.push(file);
    }
  }

  const hasConflict = network.definitions.size > 1;

  if (branchingFiles.length === 0 && !hasConflict) return null;

  return {
    branching: branchingFiles.sort(),
    conflict: hasConflict ? Array.from(network.definitions).sort() : [],
  };
};

const buildReExportNetwork = (graph: ModuleGraph, startFilePath: string, identifier: string): ReExportNetwork => {
  const network: ReExportNetwork = {
    files: new Set(),
    definitions: new Set(),
    reExportsFrom: new Map(),
  };

  const upVisited = new Set<string>();
  const downVisited = new Set<string>();

  walkUp(graph, network, startFilePath, identifier, upVisited);
  walkDown(graph, network, startFilePath, identifier, downVisited);

  for (const file of network.files) {
    if (!upVisited.has(file)) {
      walkUp(graph, network, file, identifier, upVisited);
    }
  }

  for (const definitionFile of network.definitions) {
    if (!downVisited.has(definitionFile)) walkDown(graph, network, definitionFile, identifier, downVisited);
  }

  return network;
};

const walkUp = (
  graph: ModuleGraph,
  network: ReExportNetwork,
  filePath: string,
  identifier: string,
  visited: Set<string>
) => {
  if (visited.has(filePath)) return;
  visited.add(filePath);

  const node = graph.get(filePath);
  if (!node) return;

  const exportedIds = getExportedIdentifiers(graph, filePath);
  if (!exportedIds.has(identifier)) return;

  network.files.add(filePath);

  const exp = node.exports.get(identifier);
  if (exp && !exp.isReExport) {
    network.definitions.add(filePath);
  }

  for (const [sourcePath, importMaps] of node.imports.internal) {
    forEachPassThroughReExport(importMaps, (id, _sources) => {
      if (id !== identifier) return;
      addEdge(network, sourcePath, filePath);
      walkUp(graph, network, sourcePath, identifier, visited);
    });

    forEachAliasReExport(importMaps, (sourceId, alias, _sources) => {
      if (alias !== identifier) return;
      addEdge(network, sourcePath, filePath);
      walkUp(graph, network, sourcePath, sourceId, visited);
    });

    const starSources = getStarReExportSources(importMaps);
    if (starSources) {
      const sourceExports = getExportedIdentifiers(graph, sourcePath);
      if (sourceExports.has(identifier)) {
        addEdge(network, sourcePath, filePath);
        walkUp(graph, network, sourcePath, identifier, visited);
      }
    }
  }
};

const walkDown = (
  graph: ModuleGraph,
  network: ReExportNetwork,
  filePath: string,
  identifier: string,
  visited: Set<string>
) => {
  if (visited.has(filePath)) return;
  visited.add(filePath);

  const node = graph.get(filePath);
  if (!node?.imported) return;

  const processConsumer = (consumerPath: string) => {
    network.files.add(consumerPath);
    addEdge(network, filePath, consumerPath);

    const consumerExport = graph.get(consumerPath)?.exports.get(identifier);
    if (consumerExport && !consumerExport.isReExport) network.definitions.add(consumerPath);

    walkDown(graph, network, consumerPath, identifier, visited);
  };

  const directConsumers = node.imported.reExported.get(identifier);
  if (directConsumers) {
    for (const consumerPath of directConsumers) processConsumer(consumerPath);
  }

  for (const [sourceId, aliasMap] of node.imported.reExportedAs) {
    if (sourceId === identifier) {
      for (const [_alias, consumers] of aliasMap) {
        for (const consumerPath of consumers) processConsumer(consumerPath);
      }
    }
  }

  const starConsumers = node.imported.reExported.get(IMPORT_STAR);
  if (starConsumers) {
    for (const consumerPath of starConsumers) {
      const consumerExports = getExportedIdentifiers(graph, consumerPath);
      if (consumerExports.has(identifier)) processConsumer(consumerPath);
    }
  }
};

const addEdge = (network: ReExportNetwork, source: string, consumer: string) => {
  let sources = network.reExportsFrom.get(consumer);
  if (!sources) {
    sources = new Set();
    network.reExportsFrom.set(consumer, sources);
  }
  sources.add(source);
};
