import type { CatalogCounselor } from '../CatalogCounselor.js';
import type { ConfigurationChief } from '../ConfigurationChief.js';
import type { ConsoleStreamer } from '../ConsoleStreamer.js';
import type { DependencyDeputy } from '../DependencyDeputy.js';
import { createGraphExplorer } from '../graph-explorer/explorer.js';
import type { TreeNode } from '../graph-explorer/operations/build-exports-tree.js';
import { getIssueType, hasStrictlyEnumReferences } from '../graph-explorer/utils.js';
import type { IssueCollector } from '../IssueCollector.js';
import type { IssueFixer } from '../IssueFixer.js';
import type { PrincipalFactory } from '../PrincipalFactory.js';
import type { Export, ExportMember, ModuleGraph } from '../types/module-graph.js';
import type { MainOptions } from '../util/create-options.js';
import { getPackageNameFromModuleSpecifier } from '../util/modules.js';
import { toRelative } from '../util/path.js';
import { findMatch } from '../util/regex.js';
import { getShouldIgnoreHandler, getShouldIgnoreTagHandler } from '../util/tag.js';
import { formatTrace } from '../util/trace.js';

interface AnalyzeOptions {
  analyzedFiles: Set<string>;
  counselor: CatalogCounselor;
  chief: ConfigurationChief;
  collector: IssueCollector;
  deputy: DependencyDeputy;
  entryPaths: Set<string>;
  factory: PrincipalFactory;
  fixer: IssueFixer;
  graph: ModuleGraph;
  streamer: ConsoleStreamer;
  unreferencedFiles: Set<string>;
  options: MainOptions;
}

export const analyze = async ({
  analyzedFiles,
  counselor,
  chief,
  collector,
  deputy,
  entryPaths,
  factory,
  graph,
  streamer,
  unreferencedFiles,
  options,
}: AnalyzeOptions) => {
  const shouldIgnore = getShouldIgnoreHandler(options.isProduction);
  const shouldIgnoreTags = getShouldIgnoreTagHandler(options.tags);

  const explorer = createGraphExplorer(graph, entryPaths);

  const ignoreExportsUsedInFile = chief.config.ignoreExportsUsedInFile;
  const isExportReferencedInFile = (exportedItem: Export | ExportMember) =>
    exportedItem.self[1] ||
    (exportedItem.self[0] > 0 &&
      (typeof ignoreExportsUsedInFile === 'object'
        ? exportedItem.type !== 'unknown' && !!ignoreExportsUsedInFile[exportedItem.type]
        : ignoreExportsUsedInFile));

  const analyzeGraph = async () => {
    if (options.isReportValues || options.isReportTypes) {
      streamer.cast('Connecting the dots');

      for (const [filePath, file] of graph) {
        const exportItems = file.exports;

        if (!exportItems || exportItems.size === 0) continue;

        const workspace = chief.findWorkspaceByFilePath(filePath);

        if (workspace) {
          const { isIncludeEntryExports } = workspace.config;

          const principal = factory.getPrincipalByPackageName(workspace.pkgName);

          const isEntry = entryPaths.has(filePath);

          // Bail out when in entry file (unless `isIncludeEntryExports`)
          if (!isIncludeEntryExports && isEntry) {
            continue;
          }

          const importsForExport = file.imported;

          for (const [identifier, exportedItem] of exportItems) {
            // Skip tagged exports
            if (shouldIgnore(exportedItem.jsDocTags)) continue;

            const isIgnored = shouldIgnoreTags(exportedItem.jsDocTags);

            if (importsForExport) {
              const [isReferenced, reExportingEntryFile] = explorer.isReferenced(filePath, identifier, {
                includeEntryExports: isIncludeEntryExports,
              });

              if ((isReferenced || exportedItem.self[1]) && isIgnored) {
                for (const tagName of exportedItem.jsDocTags) {
                  if (options.tags[1].includes(tagName.replace(/^@/, ''))) {
                    collector.addTagHint({ type: 'tag', filePath, identifier, tagName });
                  }
                }
              }

              if (isIgnored) continue;

              if (reExportingEntryFile && !isReferenced) {
                if (!isIncludeEntryExports) {
                  continue;
                }
                // Skip exports if re-exported from entry file and tagged
                const reExportedItem = graph.get(reExportingEntryFile)?.exports.get(identifier);
                if (reExportedItem && shouldIgnore(reExportedItem.jsDocTags)) continue;
              }

              if (isReferenced) {
                if (options.includedIssueTypes.enumMembers && exportedItem.type === 'enum') {
                  if (!options.includedIssueTypes.nsTypes && importsForExport.refs.has(identifier)) continue;
                  if (hasStrictlyEnumReferences(importsForExport, identifier)) continue;

                  for (const member of exportedItem.members) {
                    if (findMatch(workspace.ignoreMembers, member.identifier)) continue;
                    if (shouldIgnore(member.jsDocTags)) continue;

                    if (member.self[0] === 0) {
                      const id = `${identifier}.${member.identifier}`;
                      const [isMemberReferenced] = explorer.isReferenced(filePath, id, {
                        includeEntryExports: true,
                      });
                      const isIgnored = shouldIgnoreTags(member.jsDocTags);

                      if (!isMemberReferenced) {
                        if (isIgnored) continue;

                        collector.addIssue({
                          type: 'enumMembers',
                          filePath,
                          workspace: workspace.name,
                          symbol: member.identifier,
                          parentSymbol: identifier,
                          pos: member.pos,
                          line: member.line,
                          col: member.col,
                          fixes: member.fix ? [member.fix] : [],
                        });
                      } else if (isIgnored) {
                        for (const tagName of exportedItem.jsDocTags) {
                          if (options.tags[1].includes(tagName.replace(/^@/, ''))) {
                            collector.addTagHint({ type: 'tag', filePath, identifier: id, tagName });
                          }
                        }
                      }
                    }
                  }
                }

                if (principal && options.isReportClassMembers && exportedItem.type === 'class') {
                  const members = exportedItem.members.filter(
                    member => !(findMatch(workspace.ignoreMembers, member.identifier) || shouldIgnore(member.jsDocTags))
                  );
                  for (const member of principal.findUnusedMembers(filePath, members)) {
                    if (shouldIgnoreTags(member.jsDocTags)) {
                      const identifier = `${exportedItem.identifier}.${member.identifier}`;
                      for (const tagName of exportedItem.jsDocTags) {
                        if (options.tags[1].includes(tagName.replace(/^@/, ''))) {
                          collector.addTagHint({ type: 'tag', filePath, identifier, tagName });
                        }
                      }
                      continue;
                    }

                    collector.addIssue({
                      type: 'classMembers',
                      filePath,
                      workspace: workspace.name,
                      symbol: member.identifier,
                      parentSymbol: exportedItem.identifier,
                      pos: member.pos,
                      line: member.line,
                      col: member.col,
                      fixes: member.fix ? [member.fix] : [],
                    });
                  }
                }

                // This id was imported, so we bail out early
                continue;
              }
            }

            const [hasStrictlyNsRefs, namespace] = explorer.hasStrictlyNsReferences(filePath, identifier);

            const isType = ['enum', 'type', 'interface'].includes(exportedItem.type);

            if (
              hasStrictlyNsRefs &&
              ((!options.includedIssueTypes.nsTypes && isType) || !(options.includedIssueTypes.nsExports || isType))
            )
              continue;

            if (!isExportReferencedInFile(exportedItem)) {
              if (isIgnored) continue;
              if (!options.isSkipLibs && principal?.hasExternalReferences(filePath, exportedItem)) continue;

              const type = getIssueType(hasStrictlyNsRefs, isType);
              collector.addIssue({
                type,
                filePath,
                workspace: workspace.name,
                symbol: identifier,
                symbolType: exportedItem.type,
                parentSymbol: namespace,
                pos: exportedItem.pos,
                line: exportedItem.line,
                col: exportedItem.col,
                fixes: exportedItem.fixes,
              });
            }
          }
        }
      }
    }

    for (const [filePath, file] of graph) {
      const ws = chief.findWorkspaceByFilePath(filePath);

      if (ws) {
        if (file.duplicates && options.includedIssueTypes.duplicates) {
          for (const symbols of file.duplicates) {
            if (symbols.length > 1) {
              const symbol = symbols.map(s => s.symbol).join('|');
              collector.addIssue({ type: 'duplicates', filePath, workspace: ws.name, symbol, symbols, fixes: [] });
            }
          }
        }

        if (file.imports?.external) {
          for (const extImport of file.imports.external) {
            const packageName = getPackageNameFromModuleSpecifier(extImport.specifier);
            const isHandled = packageName && deputy.maybeAddReferencedExternalDependency(ws, packageName);
            if (!isHandled)
              collector.addIssue({
                type: 'unlisted',
                filePath,
                workspace: ws.name,
                symbol: packageName ?? extImport.specifier,
                specifier: extImport.specifier,
                pos: extImport.pos,
                line: extImport.line,
                col: extImport.col,
                fixes: [],
              });
          }
        }

        if (file.imports?.unresolved) {
          for (const unresolvedImport of file.imports.unresolved) {
            const { specifier, pos, line, col } = unresolvedImport;
            collector.addIssue({
              type: 'unresolved',
              filePath,
              workspace: ws.name,
              symbol: specifier,
              pos,
              line,
              col,
              fixes: [],
            });
          }
        }
      }
    }

    const unusedFiles = [...unreferencedFiles].filter(filePath => !analyzedFiles.has(filePath));

    collector.addFilesIssues(unusedFiles);

    collector.addFileCounts({ processed: analyzedFiles.size, unused: unusedFiles.length });

    if (options.isReportDependencies) {
      const { dependencyIssues, devDependencyIssues, optionalPeerDependencyIssues } = deputy.settleDependencyIssues();
      for (const issue of dependencyIssues) collector.addIssue(issue);
      if (!options.isProduction) for (const issue of devDependencyIssues) collector.addIssue(issue);
      for (const issue of optionalPeerDependencyIssues) collector.addIssue(issue);

      deputy.removeIgnoredIssues(collector.getIssues());

      const configurationHints = deputy.getConfigurationHints();
      for (const hint of configurationHints) collector.addConfigurationHint(hint);
    }

    const catalogIssues = await counselor.settleCatalogIssues(options);
    for (const issue of catalogIssues) collector.addIssue(issue);

    const unusedIgnoredWorkspaces = chief.getUnusedIgnoredWorkspaces();
    for (const identifier of unusedIgnoredWorkspaces) {
      collector.addConfigurationHint({ type: 'ignoreWorkspaces', identifier });
    }

    for (const hint of chief.getConfigurationHints()) collector.addConfigurationHint(hint);
  };

  await analyzeGraph();

  if (options.isTrace) {
    const nodes = explorer.buildExportsTree({ filePath: options.traceFile, identifier: options.traceExport });
    const toRel = (path: string) => toRelative(path, options.cwd);
    const isReferenced = (node: TreeNode) => {
      if (explorer.isReferenced(node.filePath, node.identifier, { includeEntryExports: false })[0]) return true;
      if (explorer.hasStrictlyNsReferences(node.filePath, node.identifier)[0]) return true;
      const exportItem = graph.get(node.filePath)?.exports.get(node.identifier);
      return exportItem ? isExportReferencedInFile(exportItem) : false;
    };
    // biome-ignore lint/suspicious/noConsole: gotta show it somehow..
    for (const node of nodes) console.log(formatTrace(node, toRel, isReferenced(node)));
  }

  return analyzeGraph;
};
