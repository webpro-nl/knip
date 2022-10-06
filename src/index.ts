import path from 'node:path';
import { ts } from 'ts-morph';
import { findDuplicateExportedNames, findReferencingNamespaceNodes } from 'ts-morph-helpers';
import { createProject, partitionSourceFiles, getType } from './util';
import { getLine, LineRewriter } from './log';
import type { Identifier } from 'ts-morph';
import type { Configuration, Issues, Issue } from './types';

const lineRewriter = new LineRewriter();

export async function run(configuration: Configuration) {
  const {
    cwd,
    isShowProgress,
    isFindUnusedFiles,
    isFindUnusedExports,
    isFindUnusedTypes,
    isFindDuplicateExports,
    isFindNsImports,
  } = configuration;

  // Create workspace for entry files + resolved dependencies
  const production = await createProject(cwd, configuration.entryFiles);
  const entryFiles = production.getSourceFiles();
  production.resolveSourceFileDependencies();
  const productionFiles = production.getSourceFiles();

  // Create workspace for the entire project
  const project = await createProject(cwd, configuration.filePatterns);
  const projectFiles = project.getSourceFiles();

  // Slice & dice used & unused files
  const [usedProductionFiles, unusedProductionFiles] = partitionSourceFiles(projectFiles, productionFiles);
  const [, usedNonEntryFiles] = partitionSourceFiles(usedProductionFiles, entryFiles);

  // Set up the results
  const issues: Issues = {
    file: new Set(unusedProductionFiles.map(file => file.getFilePath())),
    export: {},
    type: {},
    duplicate: {},
    member: {},
  };

  const counters = {
    file: issues.file.size,
    export: 0,
    type: 0,
    duplicate: 0,
    member: 0,
    processed: issues.file.size,
  };

  // OK, this looks ugly
  const updateProcessingOutput = (item: Issue) => {
    if (!isShowProgress) return;
    const counter = unusedProductionFiles.length + counters.processed;
    const total = unusedProductionFiles.length + usedNonEntryFiles.length;
    const percentage = Math.floor((counter / total) * 100);
    const messages = [getLine(`${percentage}%`, `of files processed (${counter} of ${total})`)];
    isFindUnusedFiles && messages.push(getLine(unusedProductionFiles.length, 'unused files'));
    isFindUnusedExports && messages.push(getLine(counters.export, 'unused exports'));
    isFindUnusedTypes && messages.push(getLine(counters.type, 'unused types'));
    isFindNsImports && messages.push(getLine(counters.member, 'unused namespace members'));
    isFindDuplicateExports && messages.push(getLine(counters.duplicate, 'duplicate exports'));
    if (counter < total) {
      messages.push('');
      messages.push(`Processing: ${path.relative(cwd, item.filePath)}`);
    }
    lineRewriter.update(messages);
  };

  const addIssue = (issueType: 'export' | 'type' | 'duplicate' | 'member', issue: Issue) => {
    const { filePath, symbol } = issue;
    const key = path.relative(cwd, filePath);
    issues[issueType][key] = issues[issueType][key] ?? {};
    issues[issueType][key][symbol] = issue;
    counters[issueType]++;
    if (isShowProgress) updateProcessingOutput(issue);
  };

  // Skip when only interested in unused files
  if (isFindUnusedExports || isFindUnusedTypes || isFindNsImports || isFindDuplicateExports) {
    usedNonEntryFiles.forEach(sourceFile => {
      const filePath = sourceFile.getFilePath();

      // The file is used, let's visit all export declarations to see which of them are not used somewhere else
      const exportDeclarations = sourceFile.getExportedDeclarations();

      if (isFindDuplicateExports) {
        const duplicateExports = findDuplicateExportedNames(sourceFile);
        duplicateExports.forEach(symbols => {
          const symbol = symbols.join(',');
          addIssue('duplicate', { filePath, symbol, symbols });
        });
      }

      if (isFindUnusedExports || isFindUnusedTypes || isFindNsImports) {
        const uniqueExportedSymbols = new Set([...exportDeclarations.values()].flat());
        if (uniqueExportedSymbols.size === 1) return; // Only one exported identifier means it's used somewhere else

        exportDeclarations.forEach(declarations => {
          declarations.forEach(declaration => {
            const type = getType(declaration);

            if (!isFindNsImports) {
              if (!isFindUnusedTypes && type) return;
              if (!isFindUnusedExports && !type) return;
            }

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

              if (isFindUnusedExports && issues.export[filePath]?.[identifierText]) return;
              if (isFindUnusedTypes && issues.type[filePath]?.[identifierText]) return;

              const refs = identifier.findReferences();
              if (refs.length === 0) {
                addIssue('export', { filePath, symbol: identifierText });
              } else {
                const refFiles = new Set(refs.map(r => r.compilerObject.references.map(r => r.fileName)).flat());

                const isReferencedOnlyBySelf = refFiles.size === 1 && [...refFiles][0] === sourceFile.getFilePath();

                if (!isReferencedOnlyBySelf) return; // This identifier is used somewhere else

                if (isFindNsImports) {
                  if (findReferencingNamespaceNodes(sourceFile).length > 0) {
                    addIssue('member', { filePath, symbol: identifierText });
                    return;
                  }
                }

                // No more reasons left to think this identifier is used somewhere else, report it as unused
                if (type) {
                  addIssue('type', { filePath, symbol: identifierText, symbolType: type });
                } else {
                  addIssue('export', { filePath, symbol: identifierText });
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

  return issues;
}
