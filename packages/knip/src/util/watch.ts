import type { WatchListener } from 'node:fs';
import type { ConfigurationChief } from '../ConfigurationChief.js';
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

export type OnUpdate = (options: { issues: Issues; duration?: number }) => void;

type Watch = {
  analyzedFiles: Set<string>;
  analyzeSourceFile: (filePath: string, principal: ProjectPrincipal) => void;
  chief: ConfigurationChief;
  collector: IssueCollector;
  analyze: () => Promise<void>;
  factory: PrincipalFactory;
  graph: ModuleGraph;
  isIgnored: (path: string) => boolean;
  onUpdate: OnUpdate;
  unreferencedFiles: Set<string>;
};

type Change = 'added' | 'deleted' | 'modified';
type FileChange = [Change, string];

export const getWatchHandler = async (
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
    onUpdate,
    unreferencedFiles,
  }: Watch
) => {
  const getIssues = () => collector.getIssues().issues;

  const processBatch = async (changes: FileChange[]) => {
    const startTime = performance.now();

    const added = new Set<string>();
    const deleted = new Set<string>();
    const modified = new Set<string>();

    for (const [type, _path] of changes) {
      const filePath = toAbsolute(_path, options.cwd);
      const relativePath = toRelative(_path, options.cwd);

      if (isIgnored(filePath)) {
        debugLog('*', `ignoring ${type} ${relativePath}`);
        continue;
      }

      const workspace = chief.findWorkspaceByFilePath(filePath);
      if (!workspace) continue;

      const principal = factory.getPrincipalByPackageName(workspace.pkgName);
      if (!principal) continue;

      switch (type) {
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
        case 'modified':
          modified.add(filePath);
          debugLog(workspace.name, `Watcher: ± ${relativePath}`);
          break;
      }

      principal.invalidateFile(filePath);
    }

    if (added.size === 0 && deleted.size === 0 && modified.size === 0) return;

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

    onUpdate({ issues: getIssues(), duration: performance.now() - startTime });
  };

  const listener: WatchListener<string | Buffer> = (eventType, filename) => {
    debugLog('*', `(raw) ${eventType} ${filename}`);
    if (typeof filename === 'string') {
      const event = eventType === 'rename' ? (isFile(join(options.cwd, filename)) ? 'added' : 'deleted') : 'modified';
      processBatch([[event, filename]]);
    }
  };

  onUpdate({ issues: getIssues() });

  return listener;
};
