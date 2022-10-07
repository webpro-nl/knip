import path from 'node:path';
import { ts } from 'ts-morph';
import { findDuplicateExportedNames, findReferencingNamespaceNodes } from 'ts-morph-helpers';
import { createProject, partitionSourceFiles, getType } from './util';
import { getLine, LineRewriter } from './log';
import type { Identifier } from 'ts-morph';
import type { Configuration, Issues, Issue, IssueType } from './types';

const lineRewriter = new LineRewriter();

export async function run(configuration: Configuration) {
  const { cwd, isShowProgress, include, jsDocOptions } = configuration;

  // Create workspace for entry files + resolved dependencies
  const production = await createProject(cwd, configuration.entryFiles);
  const entryFiles = production.getSourceFiles();
  production.resolveSourceFileDependencies();
  const productionFiles = production.getSourceFiles();

  // Create workspace for the entire project
  const project = await createProject(cwd, configuration.filePatterns);
  const projectFiles = project.getSourceFiles();

  // Slice & dice used & unreferenced files
  const [usedProductionFiles, unreferencedProductionFiles] = partitionSourceFiles(projectFiles, productionFiles);
  const [, usedNonEntryFiles] = partitionSourceFiles(usedProductionFiles, entryFiles);

  // Set up the results
  const issues: Issues = {
    files: new Set(unreferencedProductionFiles.map(file => file.getFilePath())),
    exports: {},
    types: {},
    nsExports: {},
    nsTypes: {},
    duplicates: {},
  };

  const counters = {
    files: issues.files.size,
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
    include.files && messages.push(getLine(unreferencedProductionFiles.length, 'unused files'));
    include.exports && messages.push(getLine(counters.exports, 'unused exports'));
    include.types && messages.push(getLine(counters.types, 'unused types'));
    include.nsExports && messages.push(getLine(counters.nsExports, 'unused exports in namespace'));
    include.nsTypes && messages.push(getLine(counters.nsTypes, 'unused types in namespace'));
    include.duplicates && messages.push(getLine(counters.duplicates, 'duplicate exports'));
    if (counter < total) {
      messages.push('');
      messages.push(`Processing: ${path.relative(cwd, item.filePath)}`);
    }
    lineRewriter.update(messages);
  };

  const addIssue = (issueType: Exclude<IssueType, 'files'>, issue: Issue) => {
    const { filePath, symbol } = issue;
    const key = path.relative(cwd, filePath);
    issues[issueType][key] = issues[issueType][key] ?? {};
    issues[issueType][key][symbol] = issue;
    counters[issueType]++;
    if (isShowProgress) updateProcessingOutput(issue);
  };

  // Skip when only interested in unreferenced files
  if (include.exports || include.types || include.nsExports || include.nsTypes || include.duplicates) {
    usedNonEntryFiles.forEach(sourceFile => {
      const filePath = sourceFile.getFilePath();

      // The file is used, let's visit all export declarations to see which of them are not used somewhere else
      const exportDeclarations = sourceFile.getExportedDeclarations();

      if (include.duplicates) {
        const duplicateExports = findDuplicateExportedNames(sourceFile);
        duplicateExports.forEach(symbols => {
          const symbol = symbols.join(',');
          addIssue('duplicates', { filePath, symbol, symbols });
        });
      }

      if (include.exports || include.types || include.nsExports || include.nsTypes) {
        const uniqueExportedSymbols = new Set([...exportDeclarations.values()].flat());
        if (uniqueExportedSymbols.size === 1) return; // Only one exported identifier means it's used somewhere else

        exportDeclarations.forEach(declarations => {
          declarations.forEach(declaration => {
            const type = getType(declaration);

            if (!include.nsExports && !include.nsTypes) {
              if (!include.types && type) return;
              if (!include.exports && !type) return;
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

              if (include.exports && issues.exports[filePath]?.[identifierText]) return;
              if (include.types && issues.types[filePath]?.[identifierText]) return;
              if (include.nsExports && issues.nsExports[filePath]?.[identifierText]) return;
              if (include.nsTypes && issues.nsTypes[filePath]?.[identifierText]) return;

              const refs = identifier.findReferences();

              if (refs.length === 0) {
                addIssue('exports', { filePath, symbol: identifierText });
              } else {
                const refFiles = new Set(refs.map(r => r.compilerObject.references.map(r => r.fileName)).flat());

                const isReferencedOnlyBySelf = refFiles.size === 1 && [...refFiles][0] === sourceFile.getFilePath();

                if (!isReferencedOnlyBySelf) return; // This identifier is used somewhere else

                // No more reasons left to think this identifier is used somewhere else, report it as unreferenced
                if (findReferencingNamespaceNodes(sourceFile).length > 0) {
                  if (type) {
                    addIssue('nsTypes', { filePath, symbol: identifierText });
                  } else {
                    addIssue('nsExports', { filePath, symbol: identifierText });
                  }
                } else if (type) {
                  addIssue('types', { filePath, symbol: identifierText, symbolType: type });
                } else {
                  addIssue('exports', { filePath, symbol: identifierText });
                }
              }
            }
          });
        });
      }
      counters.processed++;
    });
  }

  if (isShowProgress) lineRewriter.resetLines();

  return { issues, counters };
}
