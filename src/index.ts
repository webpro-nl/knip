import path from 'node:path';
import { ts } from 'ts-morph';
import { findDuplicateExportedNames } from 'ts-morph-helpers';
import { hasSymbol } from 'ts-morph-helpers/dist/experimental';
import { createProject, partitionSourceFiles, getType } from './util';
import { getLine, LineRewriter } from './log';
import type { Identifier } from 'ts-morph';
import type { Configuration, Issue, Issues } from './types';

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
  const allUnusedFiles: Issues = unusedProductionFiles.map(sourceFile => ({ sourceFile, name: '' }));
  const allUnusedExports: Issues = [];
  const allUnusedTypes: Issues = [];
  const allDuplicateExports: Issues = [];
  const processedNonEntryFiles: Issues = [];

  if (isShowProgress) {
    // Create proxies to automatically update output when result arrays are updated
    const set = (target: Issues, prop: any, issue: Issue) => {
      target[prop] = issue;
      updateProcessingOutput(issue);
      return true;
    };
    new Proxy(allUnusedExports, { set });
    new Proxy(allUnusedTypes, { set });
    new Proxy(allDuplicateExports, { set });
  }

  // OK, this looks ugly
  const updateProcessingOutput = (item: Issue) => {
    if (!isShowProgress) return;
    const counter = unusedProductionFiles.length + processedNonEntryFiles.length;
    const total = unusedProductionFiles.length + usedNonEntryFiles.length;
    const percentage = Math.floor((counter / total) * 100);
    const messages = [getLine(`${percentage}%`, `of files processed (${counter} of ${total})`)];
    isFindUnusedFiles && messages.push(getLine(unusedProductionFiles.length, 'unused files'));
    isFindUnusedExports && messages.push(getLine(allUnusedExports.length, 'unused exports'));
    isFindUnusedTypes && messages.push(getLine(allUnusedTypes.length, 'unused types'));
    isFindDuplicateExports && messages.push(getLine(allDuplicateExports.length, 'duplicate exports'));
    if (counter < total) {
      messages.push('');
      messages.push(
        `Current file: ${path.relative(cwd, item.sourceFile.getFilePath())}${item.name ? `@ ${item.name}` : ''}`
      );
    }
    lineRewriter.update(messages);
  };

  // Skip when only interested in unused files
  if (isFindUnusedExports || isFindUnusedTypes || isFindDuplicateExports) {
    usedNonEntryFiles.forEach(sourceFile => {
      processedNonEntryFiles.push({ sourceFile, name: '' });
      updateProcessingOutput({ sourceFile, name: '' });

      // The file is used, let's visit all export declarations to see which of them are not used somewhere else
      const exportDeclarations = sourceFile.getExportedDeclarations();

      if (isFindDuplicateExports) {
        const duplicateExports = findDuplicateExportedNames(sourceFile);
        duplicateExports.forEach(names => {
          allDuplicateExports.push({ sourceFile, name: names.join(', ') });
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
              const refs = identifier.findReferences();
              if (refs.length === 0) {
                allUnusedExports.push({ sourceFile, name: identifier.getText() });
              } else {
                const refFiles = [...new Set(refs.map(ref => ref.compilerObject.definition.fileName))];

                const isReferencedOnlyBySelf = refFiles.length === 1 && refFiles[0] === sourceFile.getFilePath();

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
                  allUnusedTypes.push({ sourceFile, name: `${type} ${identifier.getText()}` });
                } else {
                  allUnusedExports.push({ sourceFile, name: identifier.getText() });
                }
              }
            }
          });
        });
      }
    });
  }

  if (isShowProgress) lineRewriter.resetLines();

  return { allUnusedFiles, allUnusedExports, allUnusedTypes, allDuplicateExports };
}
