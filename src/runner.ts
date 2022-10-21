import path from 'node:path';
import { ts } from 'ts-morph';
import {
  findDuplicateExportedNames,
  hasReferencingDefaultImport,
  findReferencingNamespaceNodes,
} from 'ts-morph-helpers';
import { partitionSourceFiles } from './util/project';
import { getType } from './util/type';
import { getDependencyAnalyzer } from './util/dependencies';
import { debugLogSourceFiles } from './util/debug';
import { getCountersUpdater, getMessageUpdater } from './progress';
import type { Identifier } from 'ts-morph';
import type { Configuration, Issues, Issue, Counters, ProjectIssueType, SymbolIssueType } from './types';

export async function findIssues(configuration: Configuration) {
  const { workingDir, report, isDev, jsDocOptions, debug } = configuration;
  const { entryFiles, productionFiles, projectFiles, isIncludeEntryFiles } = configuration;

  const updateMessage = getMessageUpdater(configuration);

  const { getUnresolvedDependencies, getUnusedDependencies, getUnusedDevDependencies } =
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
    dependencies: new Set(),
    devDependencies: new Set(),
    unlisted: {},
    exports: {},
    types: {},
    nsExports: {},
    nsTypes: {},
    duplicates: {},
  };

  const counters: Counters = {
    files: issues.files.size,
    dependencies: issues.dependencies.size,
    devDependencies: issues.dependencies.size,
    unlisted: 0,
    exports: 0,
    types: 0,
    nsExports: 0,
    nsTypes: 0,
    duplicates: 0,
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

  const addProjectIssue = (issueType: ProjectIssueType, issue: Issue) => {
    if (!issues[issueType].has(issue.symbol)) {
      issues[issueType].add(issue.symbol);
      counters[issueType]++;
    }
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
        const unresolvedDependencies = getUnresolvedDependencies(sourceFile);
        unresolvedDependencies.forEach(issue => addSymbolIssue('unlisted', issue));
      }

      // The file is used, let's visit all export declarations to see which of them are not used somewhere else
      const exportDeclarations = sourceFile.getExportedDeclarations();

      if (report.duplicates) {
        const duplicateExports = findDuplicateExportedNames(sourceFile);
        duplicateExports.forEach(symbols => {
          const symbol = symbols.join('|');
          addSymbolIssue('duplicates', { filePath, symbol, symbols });
        });
      }

      // The default strategy is to not report unused exports for entry files.
      // When this option is set explicitly, or in zero-config mode, unused exports are also reported for entry files
      if (!isIncludeEntryFiles && usedEntryFiles.includes(sourceFile)) return;

      if (report.exports || report.types || report.nsExports || report.nsTypes) {
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
              if (!hasReferencingDefaultImport(sourceFile)) {
                fakeIdentifier = 'default';
              }
            } else if (
              declaration.isKind(ts.SyntaxKind.FunctionDeclaration) ||
              declaration.isKind(ts.SyntaxKind.ClassDeclaration) ||
              declaration.isKind(ts.SyntaxKind.TypeAliasDeclaration) ||
              declaration.isKind(ts.SyntaxKind.InterfaceDeclaration) ||
              declaration.isKind(ts.SyntaxKind.EnumDeclaration)
            ) {
              identifier = declaration.getFirstChildByKindOrThrow(ts.SyntaxKind.Identifier);
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

              const refs = identifier?.findReferences() ?? [];

              if (refs.length === 0) {
                addSymbolIssue('exports', { filePath, symbol: identifierText });
              } else {
                const refFiles = new Set(refs.map(r => r.compilerObject.references.map(r => r.fileName)).flat());

                const isReferencedOnlyBySelf = refFiles.size === 1 && [...refFiles][0] === filePath;

                if (!isReferencedOnlyBySelf) return; // This identifier is used somewhere else

                // No more reasons left to think this identifier is used somewhere else, report it as unreferenced. If
                // it's on a namespace somewhere, report it in a separate issue type.
                if (findReferencingNamespaceNodes(sourceFile).length > 0) {
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
    unusedDependencies.forEach(symbol => addProjectIssue('dependencies', { filePath: '', symbol }));
    if (isDev) {
      const unusedDevDependencies = getUnusedDevDependencies();
      unusedDevDependencies.forEach(symbol => addProjectIssue('devDependencies', { filePath: '', symbol }));
    }
  }

  updateCounters();

  return { issues, counters };
}
