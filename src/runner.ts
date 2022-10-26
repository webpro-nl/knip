import path from 'node:path';
import { ts } from 'ts-morph';
import {
  partitionSourceFiles,
  _findDuplicateExportedNames,
  _hasReferencingDefaultImport,
  _findReferencingNamespaceNodes,
  _getExportedDeclarations,
  _findReferences,
  hasExternalReferences,
  hasInternalReferences,
} from './util/project.js';
import { getType } from './util/type.js';
import { getDependencyAnalyzer } from './util/dependencies.js';
import { debugLogSourceFiles } from './util/debug.js';
import { getCountersUpdater, getMessageUpdater } from './progress.js';
import type { Identifier } from 'ts-morph';
import type { Configuration, Issues, Issue, Counters, SymbolIssueType } from './types.js';

export async function findIssues(configuration: Configuration) {
  const { workingDir, report, jsDocOptions, debug } = configuration;
  const { entryFiles, productionFiles, projectFiles, isIncludeEntryFiles } = configuration;
  const { manifestPath } = configuration;

  const updateMessage = getMessageUpdater(configuration);

  const { _findUnresolvedDependencies, getUnusedDependencies, getUnusedDevDependencies } =
    getDependencyAnalyzer(configuration);

  // Slice & dice used & unreferenced files
  const [usedProductionFiles, unreferencedProductionFiles] = partitionSourceFiles(projectFiles, productionFiles);
  const [usedEntryFiles, usedNonEntryFiles] = partitionSourceFiles(usedProductionFiles, entryFiles);

  debugLogSourceFiles(debug, 1, 'Used production files', usedProductionFiles);
  debugLogSourceFiles(debug, 1, 'Unreferenced production files', unreferencedProductionFiles);
  debugLogSourceFiles(debug, 1, 'Used entry files', usedEntryFiles);
  debugLogSourceFiles(debug, 1, 'Used non-entry files', usedNonEntryFiles);

  // Set up the results
  const issues: Issues = {
    files: new Set(unreferencedProductionFiles.map(file => file.getFilePath())),
    dependencies: {},
    devDependencies: {},
    unlisted: {},
    exports: {},
    types: {},
    nsExports: {},
    nsTypes: {},
    duplicates: {},
    enumMembers: {},
    classMembers: {},
  };

  const counters: Counters = {
    files: issues.files.size,
    dependencies: 0,
    devDependencies: 0,
    unlisted: 0,
    exports: 0,
    types: 0,
    nsExports: 0,
    nsTypes: 0,
    duplicates: 0,
    enumMembers: 0,
    classMembers: 0,
    processed: issues.files.size,
    total: projectFiles.length,
  };

  const updateCounters = getCountersUpdater(configuration, counters);

  const addSymbolIssue = (issueType: SymbolIssueType, issue: Issue) => {
    const { filePath, symbol } = issue;
    const key = path.relative(workingDir, filePath).replace(/\\/g, '/');
    issues[issueType][key] = issues[issueType][key] ?? {};
    issues[issueType][key][symbol] = issue;
    counters[issueType]++;
    updateCounters(issue);
  };

  updateMessage('Connecting the dots...');

  // Skip expensive traversal when only reporting unreferenced files
  if (
    report.dependencies ||
    report.unlisted ||
    report.exports ||
    report.types ||
    report.nsExports ||
    report.nsTypes ||
    report.duplicates
  ) {
    usedProductionFiles.forEach(sourceFile => {
      counters.processed++;
      const filePath = sourceFile.getFilePath();

      if (report.dependencies || report.unlisted) {
        const unresolvedDependencies = _findUnresolvedDependencies(sourceFile);
        unresolvedDependencies.forEach(issue => addSymbolIssue('unlisted', issue));
      }

      if (report.duplicates) {
        const duplicateExports = _findDuplicateExportedNames(sourceFile);
        duplicateExports.forEach(symbols => {
          const symbol = symbols.join('|');
          addSymbolIssue('duplicates', { filePath, symbol, symbols });
        });
      }

      // The default strategy is to not report unused exports for entry files.
      // When this option is set explicitly, or in zero-config mode, unused exports are also reported for entry files
      if (!isIncludeEntryFiles && usedEntryFiles.includes(sourceFile)) return;

      if (report.exports || report.types || report.nsExports || report.nsTypes) {
        // The file is used, let's visit all export declarations to see which of them are not used somewhere else
        const exportDeclarations = _getExportedDeclarations(sourceFile);

        if (!isIncludeEntryFiles) {
          const uniqueExportedSymbols = new Set([...exportDeclarations.values()].flat());
          if (uniqueExportedSymbols.size === 1) return; // Only one exported identifier means it's used somewhere else
        }

        exportDeclarations.forEach(declarations => {
          declarations.forEach(declaration => {
            const type = getType(declaration);

            if (!report.nsExports && !report.nsTypes) {
              if (!report.types && type) return;
              if (!report.exports && !type) return;
            }

            if (jsDocOptions.isReadPublicTag && ts.getJSDocPublicTag(declaration.compilerNode)) return;

            let identifier: Identifier | undefined;
            let fakeIdentifier: string | undefined;

            if (declaration.isKind(ts.SyntaxKind.Identifier)) {
              identifier = declaration;
            } else if (
              declaration.isKind(ts.SyntaxKind.ArrowFunction) ||
              declaration.isKind(ts.SyntaxKind.ObjectLiteralExpression) ||
              declaration.isKind(ts.SyntaxKind.ArrayLiteralExpression) ||
              declaration.isKind(ts.SyntaxKind.StringLiteral) ||
              declaration.isKind(ts.SyntaxKind.NumericLiteral)
            ) {
              // No ReferenceFindableNode/Identifier available for anonymous default exports, let's go the extra mile
              if (!_hasReferencingDefaultImport(sourceFile)) {
                fakeIdentifier = 'default';
              }
            } else if (
              declaration.isKind(ts.SyntaxKind.FunctionDeclaration) ||
              declaration.isKind(ts.SyntaxKind.TypeAliasDeclaration) ||
              declaration.isKind(ts.SyntaxKind.InterfaceDeclaration)
            ) {
              identifier = declaration.getFirstChildByKindOrThrow(ts.SyntaxKind.Identifier);
            } else if (declaration.isKind(ts.SyntaxKind.EnumDeclaration)) {
              identifier = declaration.getFirstChildByKindOrThrow(ts.SyntaxKind.Identifier);
              const members = declaration.getMembers();
              members.forEach(member => {
                const refs = _findReferences(member);
                if (hasExternalReferences(refs, filePath)) return;
                if (hasInternalReferences(refs)) return;
                addSymbolIssue('enumMembers', { filePath, symbol: member.getName() });
              });
            } else if (declaration.isKind(ts.SyntaxKind.ClassDeclaration)) {
              identifier = declaration.getFirstChildByKindOrThrow(ts.SyntaxKind.Identifier);
              const members = declaration.getMembers();
              members.forEach(member => {
                const isPrivate = member.getCombinedModifierFlags() & ts.ModifierFlags.Private;
                if (
                  !isPrivate &&
                  (member.isKind(ts.SyntaxKind.PropertyDeclaration) || member.isKind(ts.SyntaxKind.MethodDeclaration))
                ) {
                  const refs = _findReferences(member);
                  if (hasExternalReferences(refs, filePath)) return;
                  if (hasInternalReferences(refs)) return;
                  addSymbolIssue('classMembers', { filePath, symbol: member.getName() });
                }
              });
            } else if (declaration.isKind(ts.SyntaxKind.PropertyAccessExpression)) {
              identifier = declaration.getLastChildByKindOrThrow(ts.SyntaxKind.Identifier);
            } else {
              identifier = declaration.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
            }

            if (identifier || fakeIdentifier) {
              const identifierText = fakeIdentifier ?? identifier?.getText() ?? '*';

              if (report.exports && issues.exports[filePath]?.[identifierText]) return;
              if (report.types && issues.types[filePath]?.[identifierText]) return;
              if (report.nsExports && issues.nsExports[filePath]?.[identifierText]) return;
              if (report.nsTypes && issues.nsTypes[filePath]?.[identifierText]) return;

              const refs = _findReferences(identifier);

              if (refs.length === 0) {
                addSymbolIssue('exports', { filePath, symbol: identifierText });
              } else {
                if (hasExternalReferences(refs, filePath)) return;

                // No more reasons left to think this identifier is used somewhere else, report it as unreferenced. If
                // it's on a namespace somewhere, report it in a separate issue type.
                if (_findReferencingNamespaceNodes(sourceFile).length > 0) {
                  if (type) {
                    addSymbolIssue('nsTypes', { filePath, symbol: identifierText, symbolType: type });
                  } else {
                    addSymbolIssue('nsExports', { filePath, symbol: identifierText });
                  }
                } else if (type) {
                  addSymbolIssue('types', { filePath, symbol: identifierText, symbolType: type });
                } else {
                  addSymbolIssue('exports', { filePath, symbol: identifierText });
                }
              }
            }
          });
        });
      }
    });
  }

  if (report.dependencies) {
    const unusedDependencies = getUnusedDependencies();
    unusedDependencies.forEach(symbol => addSymbolIssue('dependencies', { filePath: manifestPath, symbol }));
  }
  if (report.devDependencies) {
    const unusedDevDependencies = getUnusedDevDependencies();
    unusedDevDependencies.forEach(symbol => addSymbolIssue('devDependencies', { filePath: manifestPath, symbol }));
  }

  updateCounters();

  return { issues, counters };
}
