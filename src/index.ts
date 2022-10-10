import path from 'node:path';
import { ts } from 'ts-morph';
import { findDuplicateExportedNames, findReferencingNamespaceNodes } from 'ts-morph-helpers';
import { createProject, partitionSourceFiles } from './util/project';
import { getType } from './util/type';
import { getDependencyAnalyzer } from './util/dependencies';
import { getLine, LineRewriter } from './log';
import type { Identifier } from 'ts-morph';
import type { Configuration, Issues, Issue, ProjectIssueType, SymbolIssueType } from './types';

const lineRewriter = new LineRewriter();

export async function run(configuration: Configuration) {
  const { workingDir, isShowProgress, report, isDev, jsDocOptions } = configuration;

  const { getUnresolvedDependencies, getUnusedDependencies, getUnusedDevDependencies } =
    getDependencyAnalyzer(configuration);

  // Create workspace for entry files + resolved dependencies
  const production = await createProject(workingDir, configuration.entryFiles);
  const entryFiles = production.getSourceFiles();
  production.resolveSourceFileDependencies();
  const productionFiles = production.getSourceFiles();

  // Create workspace for the entire project
  const project = await createProject(workingDir, configuration.projectFiles);
  const projectFiles = project.getSourceFiles();

  // Slice & dice used & unreferenced files
  const [usedProductionFiles, unreferencedProductionFiles] = partitionSourceFiles(projectFiles, productionFiles);
  const [usedEntryFiles, usedNonEntryFiles] = partitionSourceFiles(usedProductionFiles, entryFiles);

  // Set up the results
  const issues: Issues = {
    files: new Set(unreferencedProductionFiles.map(file => file.getFilePath())),
    dependencies: new Set(),
    devDependencies: new Set(),
    unresolved: {},
    exports: {},
    types: {},
    nsExports: {},
    nsTypes: {},
    duplicates: {},
  };

  const counters = {
    files: issues.files.size,
    dependencies: issues.dependencies.size,
    devDependencies: issues.dependencies.size,
    unresolved: 0,
    exports: 0,
    types: 0,
    nsExports: 0,
    nsTypes: 0,
    duplicates: 0,
    processed: issues.files.size,
  };

  // OK, this looks ugly
  const updateProcessingOutput = (item: Issue) => {
    if (!isShowProgress) return;
    const counter = unreferencedProductionFiles.length + counters.processed;
    const total = unreferencedProductionFiles.length + usedNonEntryFiles.length;
    const percentage = Math.floor((counter / total) * 100);
    const messages = [getLine(`${percentage}%`, `of files processed (${counter} of ${total})`)];
    report.files && messages.push(getLine(unreferencedProductionFiles.length, 'unused files'));
    report.unlisted && messages.push(getLine(counters.unresolved, 'unlisted dependencies'));
    report.exports && messages.push(getLine(counters.exports, 'unused exports'));
    report.nsExports && messages.push(getLine(counters.nsExports, 'unused exports in namespace'));
    report.types && messages.push(getLine(counters.types, 'unused types'));
    report.nsTypes && messages.push(getLine(counters.nsTypes, 'unused types in namespace'));
    report.duplicates && messages.push(getLine(counters.duplicates, 'duplicate exports'));
    if (counter < total) {
      messages.push('');
      messages.push(`Processing: ${path.relative(workingDir, item.filePath)}`);
    }
    lineRewriter.update(messages);
  };

  const addSymbolIssue = (issueType: SymbolIssueType, issue: Issue) => {
    const { filePath, symbol } = issue;
    const key = path.relative(workingDir, filePath);
    issues[issueType][key] = issues[issueType][key] ?? {};
    issues[issueType][key][symbol] = issue;
    counters[issueType]++;
    updateProcessingOutput(issue);
  };

  const addProjectIssue = (issueType: ProjectIssueType, issue: Issue) => {
    if (!issues[issueType].has(issue.symbol)) {
      issues[issueType].add(issue.symbol);
      counters[issueType]++;
    }
    updateProcessingOutput(issue);
  };

  if (report.dependencies || report.unlisted) {
    usedEntryFiles.forEach(sourceFile => {
      const unresolvedDependencies = getUnresolvedDependencies(sourceFile);
      unresolvedDependencies.forEach(issue => addSymbolIssue('unresolved', issue));
    });
  }

  // Skip when only interested in unreferenced files
  if (
    report.dependencies ||
    report.unlisted ||
    report.exports ||
    report.types ||
    report.nsExports ||
    report.nsTypes ||
    report.duplicates
  ) {
    usedNonEntryFiles.forEach(sourceFile => {
      const filePath = sourceFile.getFilePath();

      if (report.dependencies || report.unlisted) {
        const unresolvedDependencies = getUnresolvedDependencies(sourceFile);
        unresolvedDependencies.forEach(issue => addSymbolIssue('unresolved', issue));
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

      if (report.exports || report.types || report.nsExports || report.nsTypes) {
        const uniqueExportedSymbols = new Set([...exportDeclarations.values()].flat());
        if (uniqueExportedSymbols.size === 1) return; // Only one exported identifier means it's used somewhere else

        exportDeclarations.forEach(declarations => {
          declarations.forEach(declaration => {
            const type = getType(declaration);

            if (!report.nsExports && !report.nsTypes) {
              if (!report.types && type) return;
              if (!report.exports && !type) return;
            }

            if (jsDocOptions.isReadPublicTag && ts.getJSDocPublicTag(declaration.compilerNode)) return;

            let identifier: Identifier | undefined;

            if (declaration.isKind(ts.SyntaxKind.Identifier)) {
              identifier = declaration;
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

            if (identifier) {
              const identifierText = identifier.getText();

              if (report.exports && issues.exports[filePath]?.[identifierText]) return;
              if (report.types && issues.types[filePath]?.[identifierText]) return;
              if (report.nsExports && issues.nsExports[filePath]?.[identifierText]) return;
              if (report.nsTypes && issues.nsTypes[filePath]?.[identifierText]) return;

              const refs = identifier.findReferences();

              if (refs.length === 0) {
                addSymbolIssue('exports', { filePath, symbol: identifierText });
              } else {
                const refFiles = new Set(refs.map(r => r.compilerObject.references.map(r => r.fileName)).flat());

                const isReferencedOnlyBySelf = refFiles.size === 1 && [...refFiles][0] === sourceFile.getFilePath();

                if (!isReferencedOnlyBySelf) return; // This identifier is used somewhere else

                // No more reasons left to think this identifier is used somewhere else, report it as unreferenced
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
      counters.processed++;
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

  if (isShowProgress) lineRewriter.resetLines();

  return { issues, counters };
}
