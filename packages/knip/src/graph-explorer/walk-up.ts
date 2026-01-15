import type { ModuleGraph } from '../types/module-graph.js';
import { RE_EXPORT_KIND, STOP } from './constants.js';
import {
  forEachAliasReExport,
  getNamespaceReExportSources,
  getPassThroughReExportSources,
  getStarReExportSources,
} from './visitors.js';

type ReExportKind = (typeof RE_EXPORT_KIND)[keyof typeof RE_EXPORT_KIND];

type Visitor = (filePath: string, identifier: string, via: ReExportKind) => 'continue' | 'stop' | undefined;

export const walkUp = (
  graph: ModuleGraph,
  filePath: string,
  identifier: string,
  visitor: Visitor,
  visited: Set<string> = new Set()
): boolean => {
  const key = `${filePath}:${identifier}`;
  if (visited.has(key)) return false;
  visited.add(key);

  const node = graph.get(filePath);
  if (!node) return false;

  const nodeExport = node.exports.get(identifier);
  if (nodeExport && !nodeExport.isReExport) {
    return visitor(filePath, identifier, RE_EXPORT_KIND.SELF) === STOP;
  }

  const starResolvers: Array<() => boolean> = [];

  if (node.imports?.internal) {
    for (const [importedFrom, importDetails] of node.imports.internal) {
      let done = false;

      if (!done) {
        if (getPassThroughReExportSources(importDetails, identifier)) {
          if (visitor(importedFrom, identifier, RE_EXPORT_KIND.PASSTHROUGH) === STOP) {
            done = true;
          } else if (walkUp(graph, importedFrom, identifier, visitor, visited)) {
            done = true;
          }
        }
      }

      if (!done) {
        forEachAliasReExport(importDetails, (id, alias) => {
          if (alias !== identifier) return;
          if (visitor(importedFrom, id, RE_EXPORT_KIND.ALIAS) === STOP) {
            done = true;
            return false;
          }
          if (walkUp(graph, importedFrom, id, visitor, visited)) {
            done = true;
            return false;
          }
        });
      }

      if (!done) {
        if (getNamespaceReExportSources(importDetails, identifier)) {
          if (visitor(importedFrom, identifier, RE_EXPORT_KIND.NAMESPACE) === STOP) {
            done = true;
          }
        }
      }

      if (!done) {
        if (getStarReExportSources(importDetails)) {
          starResolvers.push(() => {
            if (visitor(importedFrom, identifier, RE_EXPORT_KIND.STAR) === STOP) return true;
            return walkUp(graph, importedFrom, identifier, visitor, visited);
          });
        }
      }

      if (done) return true;
    }
  }

  for (const resolveStar of starResolvers) if (resolveStar()) return true;

  return false;
};
