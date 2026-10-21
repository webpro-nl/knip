import type { WatchListener } from 'node:fs';
import { DEFAULT_EXTENSIONS, KNIP_CONFIG_LOCATIONS } from '../constants.ts';
import type { ConfigurationChief } from '../ConfigurationChief.ts';
import { invalidateCache } from '../graph-explorer/cache.ts';
import type { IssueCollector } from '../IssueCollector.ts';
import type { ProjectPrincipal } from '../ProjectPrincipal.ts';
import {
  getFileTopology,
  hasSameTopology,
  isIncrementalFile,
  SessionRebuildRequiredError,
} from '../session/incremental.ts';
import type { Issues } from '../types/issues.ts';
import type { ModuleGraph } from '../types/module-graph.ts';
import type { MainOptions } from './create-options.ts';
import { debugLog } from './debug.ts';
import { hasErrorCause } from './errors.ts';
import { isFile } from './fs.ts';
import { logError } from './log.ts';
import { updateImportMap } from './module-graph.ts';
import { basename, extname, toAbsolute, toPosix, toRelative } from './path.ts';
import { clearModuleResolutionCaches } from '../typescript/resolve-module-names.ts';
import { clearGlobCache } from './glob-cache.ts';
import { clearResolverCache } from './resolve.ts';

export type OnFileChange = (options: { issues: Issues; duration?: number; mem?: number }) => void;

export type WatchChange = {
  type: 'added' | 'deleted' | 'modified';
  filePath: string;
};

export type SessionHandler = Awaited<ReturnType<typeof getSessionHandler>>;

type WatchOptions = {
  analyzedFiles: Set<string>;
  analyzeSourceFile: (filePath: string) => Promise<void>;
  chief: ConfigurationChief;
  collector: IssueCollector;
  analyze: () => Promise<void>;
  principal: ProjectPrincipal;
  graph: ModuleGraph;
  configurationPaths: Set<string>;
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
    principal,
    graph,
    configurationPaths,
    isIgnored,
    onFileChange,
    unreferencedFiles,
    entryPaths,
  }: WatchOptions
) => {
  const added = new Set<string>();
  const deleted = new Set<string>();
  const modified = new Set<string>();
  if (options.configFilePath) configurationPaths.add(options.configFilePath);
  if (options.tsConfigFile) {
    for (const workspace of chief.workspacesByDir.values())
      configurationPaths.add(toAbsolute(options.tsConfigFile, workspace.dir));
  }
  for (const filePath of options.preprocessorInputs) configurationPaths.add(filePath);
  const restartPaths = new Set<string>();
  for (const filePath of configurationPaths) {
    if (DEFAULT_EXTENSIONS.has(extname(filePath))) restartPaths.add(filePath);
  }
  principal.collectConfigurationImports(restartPaths);
  for (const filePath of restartPaths) configurationPaths.add(filePath);
  const configurationNames = new Set([
    ...KNIP_CONFIG_LOCATIONS,
    'package.json',
    'pnpm-workspace.yaml',
    'pnpm-workspace.yml',
    'tsconfig.json',
    '.gitignore',
    'bun.lock',
    'bun.lockb',
    'pnpm-lock.yaml',
    'package-lock.json',
    'yarn.lock',
  ]);
  let rebuildRequired: SessionRebuildRequiredError | undefined;

  const processFileChanges = async (changes: WatchChange[], requireFresh = false) => {
    const startTime = performance.now();
    let hasRelevantChanges = false;

    if (rebuildRequired?.reason === 'restart') throw rebuildRequired;
    let configurationChange: SessionRebuildRequiredError | undefined;
    for (const change of changes) {
      const filePath = toAbsolute(change.filePath, options.cwd);
      if (isIgnored(filePath) && !configurationPaths.has(filePath)) continue;
      if (configurationPaths.has(filePath) || configurationNames.has(basename(filePath))) {
        const reason =
          restartPaths.has(filePath) || DEFAULT_EXTENSIONS.has(extname(filePath)) ? 'restart' : 'configuration';
        if (configurationChange?.reason !== 'restart') configurationChange = new SessionRebuildRequiredError(reason);
      }
    }
    if (configurationChange) {
      rebuildRequired = configurationChange;
      throw rebuildRequired;
    }

    for (const change of changes) {
      const filePath = toAbsolute(change.filePath, options.cwd);
      const relativePath = toRelative(change.filePath, options.cwd);

      if (isIgnored(filePath) && !configurationPaths.has(filePath)) {
        debugLog('*', `ignoring ${change.type} ${relativePath}`);
        continue;
      }

      const workspace = chief.findWorkspaceByFilePath(filePath);
      if (!workspace) continue;
      hasRelevantChanges = true;

      switch (change.type) {
        case 'added':
          principal.addProjectPath(filePath);
          deleted.delete(filePath);
          if (requireFresh || principal.projectPaths.has(filePath)) added.add(filePath);
          debugLog(workspace.name, `Watcher: + ${relativePath}`);
          break;
        case 'deleted':
          deleted.add(filePath);
          added.delete(filePath);
          analyzedFiles.delete(filePath);
          principal.removeProjectPath(filePath);
          debugLog(workspace.name, `Watcher: - ${relativePath}`);
          break;
        default: {
          if (!principal.fileManager.hasChanged(filePath)) {
            debugLog(workspace.name, `Watcher: = ${relativePath}`);
            continue;
          }
          modified.add(filePath);
          debugLog(workspace.name, `Watcher: ± ${relativePath}`);
          break;
        }
      }

      principal.invalidateFile(filePath);
    }

    if (!hasRelevantChanges || (added.size === 0 && deleted.size === 0 && modified.size === 0)) return;

    if (rebuildRequired) throw rebuildRequired;

    let incremental = added.size === 0 && deleted.size === 0 && principal.hasOnlySourceCompilers();
    if (incremental) {
      for (const filePath of modified) {
        const file = graph.get(filePath);
        if (!file || !analyzedFiles.has(filePath) || !isIncrementalFile(file)) {
          incremental = false;
          break;
        }
      }
    }
    if (incremental) {
      for (const filePath of modified) {
        const file = graph.get(filePath);
        if (!file) {
          incremental = false;
          break;
        }
        const before = getFileTopology(file);
        await analyzeSourceFile(filePath);
        if (!hasSameTopology(before, file)) {
          incremental = false;
          break;
        }
      }
    }
    if (incremental) {
      invalidateCache(graph);
      collector.purge();
      collector.getIssues().tagHints.clear();
      for (const issue of collector.getRetainedIssues()) collector.addIssue(issue);
      await analyze();
      modified.clear();
      const update = createUpdate({ startTime });
      if (onFileChange) onFileChange(Object.assign({ issues: getIssues().issues }, update));
      return update;
    }

    if (requireFresh) {
      rebuildRequired = new SessionRebuildRequiredError('graph');
      throw rebuildRequired;
    }

    clearResolverCache();
    clearModuleResolutionCaches();
    clearGlobCache();
    invalidateCache(graph);

    const filePaths = await principal.getUsedResolvedFiles();

    const cachedUnusedFiles = collector.purge();
    collector.getIssues().tagHints.clear();

    for (const filePath of added) cachedUnusedFiles.add(filePath);
    for (const filePath of deleted) cachedUnusedFiles.delete(filePath);

    if (added.size > 0 || deleted.size > 0) {
      graph.clear();
      for (const filePath of filePaths) {
        const workspace = chief.findWorkspaceByFilePath(filePath);
        if (workspace) {
          await analyzeSourceFile(filePath);
        }
      }
    } else {
      for (const [filePath, file] of graph) {
        if (filePaths.has(filePath)) {
          file.importedBy = undefined;
        } else {
          graph.delete(filePath);
          analyzedFiles.delete(filePath);
          const workspace = chief.findWorkspaceByFilePath(filePath);
          if (workspace && principal.projectPaths.has(filePath)) cachedUnusedFiles.add(filePath);
        }
      }

      for (const filePath of filePaths) {
        if (!graph.has(filePath)) {
          const workspace = chief.findWorkspaceByFilePath(filePath);
          if (workspace) {
            await analyzeSourceFile(filePath);
          }
        }
      }

      for (const filePath of modified) {
        if (!cachedUnusedFiles.has(filePath)) {
          const workspace = chief.findWorkspaceByFilePath(filePath);
          if (workspace) {
            if (principal.projectPaths.has(filePath) || graph.has(filePath)) {
              await analyzeSourceFile(filePath);
            }
          }
        }
      }

      for (const filePath of filePaths) {
        const file = graph.get(filePath);
        if (file?.internalImportCache) updateImportMap(file, file.internalImportCache, graph);
      }
    }

    const unusedFiles = [...cachedUnusedFiles].filter(filePath => !analyzedFiles.has(filePath));
    unreferencedFiles.clear();
    for (const filePath of unusedFiles) unreferencedFiles.add(filePath);
    for (const issue of collector.getRetainedIssues()) collector.addIssue(issue);
    await analyze();

    added.clear();
    deleted.clear();
    modified.clear();

    const update = createUpdate({ startTime });

    if (onFileChange) onFileChange(Object.assign({ issues: getIssues().issues }, update));

    return update;
  };

  const clearSourceText = () => principal.fileManager.sourceTextCache.clear();
  let pending = Promise.resolve();
  const handleFileChanges = (changes: WatchChange[], requireFresh = false) => {
    const update = pending.then(() => processFileChanges(changes, requireFresh));
    pending = update.then(clearSourceText, clearSourceText);
    return update;
  };

  const listener: WatchListener<string | Buffer> = (eventType, filePath) => {
    debugLog('*', `(raw) ${eventType} ${filePath}`);
    if (typeof filePath === 'string') {
      // On Windows, fs.watch provides paths with backslash separators.
      // Normalize to POSIX separators so downstream posix path utilities work correctly.
      const normalizedPath = toPosix(filePath);
      const type = eventType === 'rename' ? (isFile(options.cwd, normalizedPath) ? 'added' : 'deleted') : 'modified';
      handleFileChanges([{ type, filePath: normalizedPath }]).catch(error => {
        const message = error instanceof Error ? error.message : String(error);
        const reason = error instanceof Error && hasErrorCause(error) ? `\nReason: ${error.cause.message}` : '';
        logError(message + reason);
        process.exitCode = 2;
      });
    }
  };

  const getIssues = () => collector.getIssues();

  const getEntryPaths = () => entryPaths;

  const getGraph = () => graph;

  if (onFileChange) onFileChange({ issues: getIssues().issues });

  return { listener, handleFileChanges, getEntryPaths, getGraph, getIssues };
};
