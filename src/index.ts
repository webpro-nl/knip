import path from 'node:path';
import { SourceFile, ts } from 'ts-morph';
import { findDuplicateExportedNames } from 'ts-morph-helpers';
import { hasSymbol } from 'ts-morph-helpers/dist/experimental';
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
    isIgnoreNamespaceImports
  } = configuration;

  // Create workspace for entry files + resolved dependencies
  const production = createProject(cwd, configuration.entryFiles);
  const entryFiles = production.getSourceFiles();
  production.resolveSourceFileDependencies();
  const productionFiles = production.getSourceFiles();

  // Create workspace for the entire project
  const project = createProject(cwd, configuration.filePatterns);
  const projectFiles = project.getSourceFiles();

  // Slice & dice used & unused files
  const [usedProductionFiles, unusedProductionFiles] = partitionSourceFiles(projectFiles, productionFiles);
  const [, usedNonEntryFiles] = partitionSourceFiles(usedProductionFiles, entryFiles);

  // Set up the results
  const issues: Issues = {
    file: new Map(),
    export: new Map(),
    type: new Map(),
    duplicate: new Map()
  };

  unusedProductionFiles.forEach(file =>
    issues.file.set(file.getFilePath(), { filePath: file.getFilePath(), symbol: '' })
  );

  const processedNonEntryFiles: SourceFile[] = [];

  if (isShowProgress) {
    // Create proxies to automatically update output when result arrays are updated
    new Proxy(issues, {
      get(target, prop, issue) {
        let value = Reflect.get(target, prop, issue);
        updateProcessingOutput(issue);
        return typeof value == 'function' ? value.bind(target) : value;
      }
    });
  }

  // OK, this looks ugly
  const updateProcessingOutput = (item: Issue) => {
    if (!isShowProgress) return;
    const counter = unusedProductionFiles.length + processedNonEntryFiles.length;
    const total = unusedProductionFiles.length + usedNonEntryFiles.length;
    const percentage = Math.floor((counter / total) * 100);
    const messages = [getLine(`${percentage}%`, `of files processed (${counter} of ${total})`)];
    isFindUnusedFiles && messages.push(getLine(unusedProductionFiles.length, 'unused files'));
    isFindUnusedExports && messages.push(getLine(issues.export.size, 'unused exports'));
    isFindUnusedTypes && messages.push(getLine(issues.type.size, 'unused types'));
    isFindDuplicateExports && messages.push(getLine(issues.duplicate.size, 'duplicate exports'));
    if (counter < total) {
      messages.push('');
      messages.push(`Processing: ${path.relative(cwd, item.filePath)}`);
    }
    lineRewriter.update(messages);
  };

  // Skip when only interested in unused files
  if (isFindUnusedExports || isFindUnusedTypes || isFindDuplicateExports) {
    usedNonEntryFiles.forEach(sourceFile => {
      const filePath = sourceFile.getFilePath();
      processedNonEntryFiles.push(sourceFile);
      updateProcessingOutput({ filePath: sourceFile.getFilePath(), symbol: '' });

      // The file is used, let's visit all export declarations to see which of them are not used somewhere else
      const exportDeclarations = sourceFile.getExportedDeclarations();

      if (isFindDuplicateExports) {
        const duplicateExports = findDuplicateExportedNames(sourceFile);
        duplicateExports.forEach(symbols => {
          const symbol = symbols.join(', ');
          issues.duplicate.set(`${filePath}:${symbol}`, { filePath, symbols, symbol });
        });
      }

      if (isFindUnusedExports || isFindUnusedTypes) {
        const uniqueExportedSymbols = new Set([...exportDeclarations.values()].flat());
        if (uniqueExportedSymbols.size === 1) return; // Only one exported identifier means it's used somewhere else

        exportDeclarations.forEach(declarations => {
          declarations.forEach(declaration => {
            const type = getType(declaration);

            if (!isFindUnusedTypes && type) return;
            if (!isFindUnusedExports && !type) return;

            let identifier: Identifier | undefined;

            if (declaration.isKind(ts.SyntaxKind.Identifier)) {
              identifier = declaration;
            } else if (declaration.isKind(ts.SyntaxKind.FunctionDeclaration)) {
              identifier = declaration.getFirstChildByKindOrThrow(ts.SyntaxKind.Identifier);
            } else if (declaration.isKind(ts.SyntaxKind.PropertyAccessExpression)) {
              identifier = declaration.getLastChildByKindOrThrow(ts.SyntaxKind.Identifier);
            } else {
              identifier = declaration.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
            }

            if (identifier) {
              const identifierText = identifier.getText();

              if (isFindUnusedExports && issues.export.has(`${filePath}:${identifierText}`)) return;
              if (isFindUnusedTypes && issues.type.has(`${filePath}:${identifierText}`)) return;

              const refs = identifier.findReferences();
              if (refs.length === 0) {
                issues.export.set(`${filePath}:${identifierText}`, { filePath, symbol: identifierText });
              } else {
                const refFiles = new Set(refs.map(r => r.compilerObject.references.map(r => r.fileName)).flat());

                const isReferencedOnlyBySelf = refFiles.size === 1 && [...refFiles][0] === sourceFile.getFilePath();

                if (!isReferencedOnlyBySelf) return; // This identifier is used somewhere else

                if (!isIgnoreNamespaceImports) {
                  const symbol = identifier.getSymbol();
                  if (symbol) {
                    const referencingSourceFiles = sourceFile.getReferencingSourceFiles();
                    if (hasSymbol(referencingSourceFiles, symbol)) return; // This identifier is used somewhere else
                  }
                }

                // No more reasons left to think this identifier is used somewhere else, report it as unused
                if (type) {
                  issues.type.set(`${filePath}:${identifierText}`, { filePath, type, symbol: identifierText });
                } else {
                  issues.export.set(`${filePath}:${identifierText}`, { filePath, symbol: identifierText });
                }
              }
            }
          });
        });
      }
    });
  }

  if (isShowProgress) lineRewriter.resetLines();

  return {
    file: Array.from(issues.file.values()),
    export: Array.from(issues.export.values()),
    type: Array.from(issues.type.values()),
    duplicate: Array.from(issues.duplicate.values())
  };
}
