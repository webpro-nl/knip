import type { WatchListener } from 'node:fs';
import type { ConfigurationChief } from '../ConfigurationChief.js';
import { invalidateCache } from '../graph-explorer/cache.js';
import type { IssueCollector } from '../IssueCollector.js';
import type { PrincipalFactory } from '../PrincipalFactory.js';
import type { ProjectPrincipal } from '../ProjectPrincipal.js';
import type { Issues } from '../types/issues.js';
import type { ModuleGraph } from '../types/module-graph.js';
import type { MainOptions } from './create-options.js';
import { debugLog } from './debug.js';
import { isFile } from './fs.js';
import { updateImportMap } from './module-graph.js';
import { join, toAbsolute, toRelative } from './path.js';

export type OnFileChange = (options: { issues: Issues; duration?: number; mem?: number }) => void;

export type WatchChange = {
  type: 'added' | 'deleted' | 'modified';
  filePath: string;
};

export type SessionHandler = Awaited<ReturnType<typeof getSessionHandler>>;

type WatchOptions = {
  analyzedFiles: Set<string>;
  analyzeSourceFile: (filePath: string, principal: ProjectPrincipal) => void;
  chief: ConfigurationChief;
  collector: IssueCollector;
  analyze: () => Promise<void>;
  factory: PrincipalFactory;
  graph: ModuleGraph;
  isIgnored: (path: string) => boolean;
  onFileChange?: OnFileChange;
  unreferencedFiles: Set<string>;
  entryPaths: Set<string>;
};

const createUpdate = (options: { startTime: number }) => {
  const duration = performance.now() - options.startTime;
  const mem = process.memoryUsage().heapUsed;
  return { duration, mem };
};

export const getSessionHandler = async (
  options: MainOptions,
  {
    analyzedFiles,
    analyzeSourceFile,
    chief,
    collector,
    analyze,
    factory,
    graph,
    isIgnored,
    onFileChange,
    unreferencedFiles,
    entryPaths,
  }: WatchOptions
) => {
  const getIssues = () => collector.getIssues().issues;

  const handleFileChanges = async (changes: WatchChange[]) => {
    const startTime = performance.now();

    const added = new Set<string>();
    const deleted = new Set<string>();
    const modified = new Set<string>();

    for (const change of changes) {
      const filePath = toAbsolute(change.filePath, options.cwd);
      const relativePath = toRelative(change.filePath, options.cwd);

      if (isIgnored(filePath)) {
        debugLog('*', `ignoring ${change.type} ${relativePath}`);
        continue;
      }

      const workspace = chief.findWorkspaceByFilePath(filePath);
      if (!workspace) continue;

      const principal = factory.getPrincipalByPackageName(workspace.pkgName);
      if (!principal) continue;

      switch (change.type) {
        case 'added':
          added.add(filePath);
          principal.addProjectPath(filePath);
          principal.deletedFiles.delete(filePath);
          debugLog(workspace.name, `Watcher: + ${relativePath}`);
          break;
        case 'deleted':
          deleted.add(filePath);
          analyzedFiles.delete(filePath);
          principal.removeProjectPath(filePath);
          debugLog(workspace.name, `Watcher: - ${relativePath}`);
          break;
        default:
          modified.add(filePath);
          debugLog(workspace.name, `Watcher: ± ${relativePath}`);
          break;
      }

      principal.invalidateFile(filePath);
    }

    if (added.size === 0 && deleted.size === 0 && modified.size === 0) return createUpdate({ startTime });

    invalidateCache(graph);

    unreferencedFiles.clear();
    const cachedUnusedFiles = collector.purge();

    for (const filePath of added) cachedUnusedFiles.add(filePath);
    for (const filePath of deleted) cachedUnusedFiles.delete(filePath);

    const filePaths = factory.getPrincipals().flatMap(p => p.getUsedResolvedFiles());

    if (added.size > 0 || deleted.size > 0) {
      graph.clear();
      for (const filePath of filePaths) {
        const workspace = chief.findWorkspaceByFilePath(filePath);
        if (workspace) {
          const principal = factory.getPrincipalByPackageName(workspace.pkgName);
          if (principal) analyzeSourceFile(filePath, principal);
        }
      }
    } else {
      for (const [filePath, file] of graph) {
        if (filePaths.includes(filePath)) {
          file.imported = undefined;
        } else {
          graph.delete(filePath);
          analyzedFiles.delete(filePath);
          const workspace = chief.findWorkspaceByFilePath(filePath);
          if (workspace) {
            const principal = factory.getPrincipalByPackageName(workspace.pkgName);
            if (principal?.projectPaths.has(filePath)) cachedUnusedFiles.add(filePath);
          }
        }
      }

      for (const filePath of filePaths) {
        if (!graph.has(filePath)) {
          const workspace = chief.findWorkspaceByFilePath(filePath);
          if (workspace) {
            const principal = factory.getPrincipalByPackageName(workspace.pkgName);
            if (principal) analyzeSourceFile(filePath, principal);
          }
        }
      }

      for (const filePath of modified) {
        if (!cachedUnusedFiles.has(filePath)) {
          const workspace = chief.findWorkspaceByFilePath(filePath);
          if (workspace) {
            const principal = factory.getPrincipalByPackageName(workspace.pkgName);
            if (principal) analyzeSourceFile(filePath, principal);
          }
        }
      }

      for (const filePath of filePaths) {
        const file = graph.get(filePath);
        if (file?.internalImportCache) updateImportMap(file, file.internalImportCache, graph);
      }
    }

    await analyze();

    const unusedFiles = [...cachedUnusedFiles].filter(filePath => !analyzedFiles.has(filePath));
    collector.addFilesIssues(unusedFiles);
    collector.addFileCounts({ processed: analyzedFiles.size, unused: unusedFiles.length });

    for (const issue of collector.getRetainedIssues()) collector.addIssue(issue);

    const update = createUpdate({ startTime });

    if (onFileChange) onFileChange(Object.assign({ issues: getIssues() }, update));

    return update;
  };

  const listener: WatchListener<string | Buffer> = (eventType, filePath) => {
    debugLog('*', `(raw) ${eventType} ${filePath}`);
    if (typeof filePath === 'string') {
      const type = eventType === 'rename' ? (isFile(join(options.cwd, filePath)) ? 'added' : 'deleted') : 'modified';
      handleFileChanges([{ type, filePath }]);
    }
  };

  if (onFileChange) onFileChange({ issues: getIssues() });

  const getEntryPaths = () => entryPaths;

  const getGraph = () => graph;

  return { listener, handleFileChanges, getEntryPaths, getGraph, getIssues };
};
