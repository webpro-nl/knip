import type { ConfigurationChief } from '../ConfigurationChief.js';
import type { ConsoleStreamer } from '../ConsoleStreamer.js';
import type { DependencyDeputy } from '../DependencyDeputy.js';
import type { IssueCollector } from '../IssueCollector.js';
import type { IssueFixer } from '../IssueFixer.js';
import type { PrincipalFactory } from '../PrincipalFactory.js';
import type { Tags } from '../types/cli.js';
import type { Report } from '../types/issues.js';
import type { Export, ExportMember, ModuleGraph } from '../types/module-graph.js';
import { getType, hasStrictlyEnumReferences, hasStrictlyNsReferences } from '../util/has-strictly-ns-references.js';
import { getIsIdentifierReferencedHandler } from '../util/is-identifier-referenced.js';
import { getPackageNameFromModuleSpecifier } from '../util/modules.js';
import { findMatch } from '../util/regex.js';
import { getShouldIgnoreHandler, getShouldIgnoreTagHandler } from '../util/tag.js';
import { createAndPrintTrace, printTrace } from '../util/trace.js';

interface AnalyzeOptions {
  analyzedFiles: Set<string>;
  chief: ConfigurationChief;
  collector: IssueCollector;
  deputy: DependencyDeputy;
  entryPaths: Set<string>;
  factory: PrincipalFactory;
  fixer: IssueFixer;
  graph: ModuleGraph;
  isFix: boolean;
  isHideConfigHints: boolean;
  isIncludeLibs: boolean;
  isProduction: boolean;
  report: Report;
  streamer: ConsoleStreamer;
  tags: Tags;
  unreferencedFiles: Set<string>;
  workspace?: string;
}

export const analyze = async (options: AnalyzeOptions) => {
  const {
    analyzedFiles,
    chief,
    collector,
    deputy,
    entryPaths,
    factory,
    fixer,
    graph,
    isFix,
    isHideConfigHints,
    isIncludeLibs,
    isProduction,
    report,
    streamer,
    tags,
    unreferencedFiles,
    workspace,
  } = options;

  const isReportDependencies = report.dependencies || report.unlisted || report.unresolved;
  const isReportValues = report.exports || report.nsExports || report.classMembers;
  const isReportTypes = report.types || report.nsTypes || report.enumMembers;
  const isReportClassMembers = report.classMembers;
  const isSkipLibs = !(isIncludeLibs || isReportClassMembers);
  const isShowConfigHints = !workspace && !isProduction && !isHideConfigHints;

  const shouldIgnore = getShouldIgnoreHandler(isProduction);
  const shouldIgnoreTags = getShouldIgnoreTagHandler(tags);

  const isIdentifierReferenced = getIsIdentifierReferencedHandler(graph, entryPaths);

  const ignoreExportsUsedInFile = chief.config.ignoreExportsUsedInFile;
  const isExportedItemReferenced = (exportedItem: Export | ExportMember) =>
    exportedItem.refs[1] ||
    (exportedItem.refs[0] > 0 &&
      (typeof ignoreExportsUsedInFile === 'object'
        ? exportedItem.type !== 'unknown' && !!ignoreExportsUsedInFile[exportedItem.type]
        : ignoreExportsUsedInFile));

  const analyzeGraph = async () => {
    if (isReportValues || isReportTypes) {
      streamer.cast('Connecting the dots...');

      for (const [filePath, file] of graph.entries()) {
        const exportItems = file.exports;

        if (!exportItems || exportItems.size === 0) continue;

        const workspace = chief.findWorkspaceByFilePath(filePath);

        if (workspace) {
          const { isIncludeEntryExports } = workspace.config;

          const principal = factory.getPrincipalByPackageName(workspace.pkgName);

          const isEntry = entryPaths.has(filePath);

          // Bail out when in entry file (unless `isIncludeEntryExports`)
          if (!isIncludeEntryExports && isEntry) {
            createAndPrintTrace(filePath, { isEntry });
            continue;
          }

          const importsForExport = file.imported;

          for (const [identifier, exportedItem] of exportItems.entries()) {
            if (!isFix && exportedItem.isReExport) continue;

            // Skip tagged exports
            if (shouldIgnore(exportedItem.jsDocTags)) continue;

            const isIgnored = shouldIgnoreTags(exportedItem.jsDocTags);

            if (importsForExport) {
              const { isReferenced, reExportingEntryFile, traceNode } = isIdentifierReferenced(
                filePath,
                identifier,
                isIncludeEntryExports
              );

              if ((isReferenced || exportedItem.refs[1]) && isIgnored) {
                for (const tagName of exportedItem.jsDocTags) {
                  if (tags[1].includes(tagName.replace(/^\@/, ''))) {
                    collector.addTagHint({ type: 'tag', filePath, identifier, tagName });
                  }
                }
              }

              if (isIgnored) continue;

              if (reExportingEntryFile) {
                if (!isIncludeEntryExports) {
                  createAndPrintTrace(filePath, { identifier, isEntry, hasRef: isReferenced });
                  continue;
                }
                // Skip exports if re-exported from entry file and tagged
                const reExportedItem = graph.get(reExportingEntryFile)?.exports.get(identifier);
                if (reExportedItem && shouldIgnore(reExportedItem.jsDocTags)) continue;
              }

              if (traceNode) printTrace(traceNode, filePath, identifier);

              if (isReferenced) {
                if (report.enumMembers && exportedItem.type === 'enum') {
                  if (!report.nsTypes && importsForExport.refs.has(identifier)) continue;
                  if (hasStrictlyEnumReferences(importsForExport, identifier)) continue;

                  for (const member of exportedItem.members) {
                    if (findMatch(workspace.ignoreMembers, member.identifier)) continue;
                    if (shouldIgnore(member.jsDocTags)) continue;

                    if (member.refs[0] === 0) {
                      const id = `${identifier}.${member.identifier}`;
                      const { isReferenced } = isIdentifierReferenced(filePath, id, true);
                      const isIgnored = shouldIgnoreTags(member.jsDocTags);

                      if (!isReferenced) {
                        if (isIgnored) continue;

                        const isIssueAdded = collector.addIssue({
                          type: 'enumMembers',
                          filePath,
                          workspace: workspace.name,
                          symbol: member.identifier,
                          parentSymbol: identifier,
                          pos: member.pos,
                          line: member.line,
                          col: member.col,
                        });

                        if (isFix && isIssueAdded && member.fix) fixer.addUnusedTypeNode(filePath, [member.fix]);
                      } else if (isIgnored) {
                        for (const tagName of exportedItem.jsDocTags) {
                          if (tags[1].includes(tagName.replace(/^\@/, ''))) {
                            collector.addTagHint({ type: 'tag', filePath, identifier: id, tagName });
                          }
                        }
                      }
                    }
                  }
                }

                if (principal && isReportClassMembers && exportedItem.type === 'class') {
                  const members = exportedItem.members.filter(
                    member => !(findMatch(workspace.ignoreMembers, member.identifier) || shouldIgnore(member.jsDocTags))
                  );
                  for (const member of principal.findUnusedMembers(filePath, members)) {
                    if (shouldIgnoreTags(member.jsDocTags)) {
                      const identifier = `${exportedItem.identifier}.${member.identifier}`;
                      for (const tagName of exportedItem.jsDocTags) {
                        if (tags[1].includes(tagName.replace(/^\@/, ''))) {
                          collector.addTagHint({ type: 'tag', filePath, identifier, tagName });
                        }
                      }
                      continue;
                    }

                    const isIssueAdded = collector.addIssue({
                      type: 'classMembers',
                      filePath,
                      workspace: workspace.name,
                      symbol: member.identifier,
                      parentSymbol: exportedItem.identifier,
                      pos: member.pos,
                      line: member.line,
                      col: member.col,
                    });

                    if (isFix && isIssueAdded && member.fix) fixer.addUnusedTypeNode(filePath, [member.fix]);
                  }
                }

                // This id was imported, so we bail out early
                continue;
              }
            }

            const [hasStrictlyNsRefs, namespace] = hasStrictlyNsReferences(graph, importsForExport, identifier);

            const isType = ['enum', 'type', 'interface'].includes(exportedItem.type);

            if (hasStrictlyNsRefs && ((!report.nsTypes && isType) || !(report.nsExports || isType))) continue;

            if (!isExportedItemReferenced(exportedItem)) {
              if (isIgnored) continue;
              if (!isSkipLibs && principal?.hasExternalReferences(filePath, exportedItem)) continue;

              const type = getType(hasStrictlyNsRefs, isType);
              const isIssueAdded = collector.addIssue({
                type,
                filePath,
                workspace: workspace.name,
                symbol: identifier,
                symbolType: exportedItem.type,
                parentSymbol: namespace,
                pos: exportedItem.pos,
                line: exportedItem.line,
                col: exportedItem.col,
              });

              if (isFix && isIssueAdded) {
                if (isType) fixer.addUnusedTypeNode(filePath, exportedItem.fixes);
                else fixer.addUnusedExportNode(filePath, exportedItem.fixes);
              }
            }
          }
        }
      }
    }

    for (const [filePath, file] of graph.entries()) {
      const ws = chief.findWorkspaceByFilePath(filePath);

      if (ws) {
        if (file.duplicates) {
          for (const symbols of file.duplicates) {
            if (symbols.length > 1) {
              const symbol = symbols.map(s => s.symbol).join('|');
              collector.addIssue({ type: 'duplicates', filePath, workspace: ws.name, symbol, symbols });
            }
          }
        }

        if (file.imports?.external) {
          for (const specifier of file.imports.external) {
            const packageName = getPackageNameFromModuleSpecifier(specifier);
            const isHandled = packageName && deputy.maybeAddReferencedExternalDependency(ws, packageName);
            if (!isHandled)
              collector.addIssue({
                type: 'unlisted',
                filePath,
                workspace: ws.name,
                symbol: packageName ?? specifier,
                specifier,
              });
          }
        }

        if (file.imports?.unresolved) {
          for (const unresolvedImport of file.imports.unresolved) {
            const { specifier, pos, line, col } = unresolvedImport;
            collector.addIssue({ type: 'unresolved', filePath, workspace: ws.name, symbol: specifier, pos, line, col });
          }
        }
      }
    }

    const unusedFiles = [...unreferencedFiles].filter(filePath => !analyzedFiles.has(filePath));

    collector.addFilesIssues(unusedFiles);

    collector.addFileCounts({ processed: analyzedFiles.size, unused: unusedFiles.length });

    if (isReportDependencies) {
      const { dependencyIssues, devDependencyIssues, optionalPeerDependencyIssues } = deputy.settleDependencyIssues();
      for (const issue of dependencyIssues) collector.addIssue(issue);
      if (!isProduction) for (const issue of devDependencyIssues) collector.addIssue(issue);
      for (const issue of optionalPeerDependencyIssues) collector.addIssue(issue);

      deputy.removeIgnoredIssues(collector.getIssues());

      // Hints about ignored dependencies/binaries can be confusing/annoying/incorrect in production/strict mode
      if (isShowConfigHints) {
        const configurationHints = deputy.getConfigurationHints();
        for (const hint of configurationHints) collector.addConfigurationHint(hint);
      }
    }

    if (isShowConfigHints) {
      const unusedIgnoredWorkspaces = chief.getUnusedIgnoredWorkspaces();
      for (const identifier of unusedIgnoredWorkspaces) {
        collector.addConfigurationHint({ type: 'ignoreWorkspaces', identifier });
      }
    }
  };

  await analyzeGraph();

  return analyzeGraph;
};
