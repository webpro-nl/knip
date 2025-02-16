import type { WatchListener } from 'node:fs';
import type { ConfigurationChief } from '../ConfigurationChief.js';
import type { ConsoleStreamer } from '../ConsoleStreamer.js';
import type { IssueCollector } from '../IssueCollector.js';
import type { PrincipalFactory } from '../PrincipalFactory.js';
import type { ProjectPrincipal } from '../ProjectPrincipal.js';
import watchReporter from '../reporters/watch.js';
import type { Report } from '../types/issues.js';
import type { ModuleGraph } from '../types/module-graph.js';
import { debugLog } from './debug.js';
import { isFile } from './fs.js';
import { updateImportMap } from './module-graph.js';
import { join, toPosix } from './path.js';

type Watch = {
  analyzedFiles: Set<string>;
  analyzeSourceFile: (filePath: string, principal: ProjectPrincipal) => void;
  chief: ConfigurationChief;
  collector: IssueCollector;
  analyze: () => Promise<void>;
  cwd: string;
  factory: PrincipalFactory;
  graph: ModuleGraph;
  isDebug: boolean;
  isIgnored: (path: string) => boolean;
  report: Report;
  streamer: ConsoleStreamer;
  unreferencedFiles: Set<string>;
};

export const getWatchHandler = async ({
  analyzedFiles,
  analyzeSourceFile,
  chief,
  collector,
  analyze,
  cwd,
  factory,
  graph,
  isDebug,
  isIgnored,
  report,
  streamer,
  unreferencedFiles,
}: Watch) => {
  const reportIssues = async (startTime?: number) => {
    const { issues } = collector.getIssues();
    watchReporter({ report, issues, streamer, startTime, size: analyzedFiles.size, isDebug });
  };

  const listener: WatchListener<string | Buffer> = async (eventType: string, filename: string | Buffer | null) => {
    debugLog('*', `(raw) ${eventType} ${filename}`);

    if (typeof filename === 'string') {
      const startTime = performance.now();
      const filePath = join(cwd, toPosix(filename));

      if (isIgnored(filePath)) {
        debugLog('*', `ignoring ${eventType} ${filename}`);
        return;
      }

      const workspace = chief.findWorkspaceByFilePath(filePath);
      if (workspace) {
        const principal = factory.getPrincipalByPackageName(workspace.pkgName);
        if (principal) {
          const event = eventType === 'rename' ? (isFile(filePath) ? 'added' : 'deleted') : 'modified';

          principal.invalidateFile(filePath);
          unreferencedFiles.clear();
          const cachedUnusedFiles = collector.purge();

          switch (event) {
            case 'added':
              principal.addProjectPath(filePath);
              principal.deletedFiles.delete(filePath);
              cachedUnusedFiles.add(filePath);
              debugLog(workspace.name, `Watcher: + ${filename}`);
              break;
            case 'deleted':
              analyzedFiles.delete(filePath);
              principal.removeProjectPath(filePath);
              cachedUnusedFiles.delete(filePath);
              debugLog(workspace.name, `Watcher: - ${filename}`);
              break;
            case 'modified':
              debugLog(workspace.name, `Watcher: ± ${filename}`);
              break;
          }

          const filePaths = principal.getUsedResolvedFiles();

          if (event === 'added' || event === 'deleted') {
            // Flush to reset imports/exports
            graph.clear();
            for (const filePath of filePaths) analyzeSourceFile(filePath, principal);
          } else {
            for (const [filePath, file] of graph) {
              if (filePaths.includes(filePath)) {
                // Reset dep graph
                file.imported = undefined;
              } else {
                // Remove files no longer referenced
                graph.delete(filePath);
                analyzedFiles.delete(filePath);
                if (filePath.startsWith(cwd)) cachedUnusedFiles.add(filePath);
              }
            }

            // Add existing files that were not yet part of the program
            for (const filePath of filePaths) if (!graph.has(filePath)) analyzeSourceFile(filePath, principal);

            if (!cachedUnusedFiles.has(filePath)) analyzeSourceFile(filePath, principal);

            // Rebuild dep graph
            for (const filePath of filePaths) {
              const file = graph.get(filePath);
              if (file?.internalImportCache) updateImportMap(file, file.internalImportCache, graph);
            }
          }

          await analyze();

          const unusedFiles = [...cachedUnusedFiles].filter(filePath => !analyzedFiles.has(filePath));
          collector.addFilesIssues(unusedFiles);
          collector.addFileCounts({ processed: analyzedFiles.size, unused: unusedFiles.length });

          await reportIssues(startTime);
        }
      }
    }
  };

  await reportIssues();

  return listener;
};
