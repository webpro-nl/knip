import { isDeepStrictEqual } from 'node:util';
import type { FileNode } from '../types/module-graph.ts';

export class SessionRebuildRequiredError extends Error {
  readonly reason: 'configuration' | 'graph' | 'restart';

  constructor(reason: 'configuration' | 'graph' | 'restart') {
    super(
      reason === 'restart'
        ? 'A loaded configuration module changed; restart the session in a new process to reload its imports'
        : reason === 'configuration'
          ? 'Configuration changed; recreate options and the session, or use createPersistentSession'
          : 'The file changes require a fresh session graph'
    );
    this.reason = reason;
  }
}

export const isIncrementalFile = (file: FileNode) =>
  file.scripts.size === 0 &&
  file.importGlobs.length === 0 &&
  file.imports.programFiles.size === 0 &&
  file.imports.entryFiles.size === 0;

export const getFileTopology = (file: FileNode) => {
  const exports = [];
  for (const [identifier, item] of file.exports) {
    const members = [];
    for (const member of item.members) {
      members.push({
        identifier: member.identifier,
        type: member.type,
        flags: member.flags,
        jsDocTags: member.jsDocTags,
        hasRefsInFile: member.hasRefsInFile,
      });
    }
    exports.push({
      identifier,
      binding: item.binding,
      type: item.type,
      jsDocTags: item.jsDocTags,
      hasRefsInFile: item.hasRefsInFile,
      isRegistered: item.isRegistered,
      referencedIn: item.referencedIn,
      isReExport: item.isReExport,
      isBindingReExport: item.isBindingReExport,
      members,
    });
  }
  return { imports: file.imports, paths: [...file.imports.internal.keys()], exports, skipExports: file.skipExports };
};

export const hasSameTopology = (before: ReturnType<typeof getFileTopology>, after: FileNode) =>
  isIncrementalFile(after) && isDeepStrictEqual(before, getFileTopology(after));
