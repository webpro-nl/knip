import { isBuiltin } from 'node:module';
import ts from 'typescript';
import * as ast from './ast-helpers.js';
import type { BoundSourceFile } from './SourceFile.js';
import type { Imports, ExportItems, ExportItem } from '../types/ast.js';

type Options = {
  skipTypeOnly: boolean;
  skipExports: boolean;
};

type AddImportOptions = {
  specifier: string;
  symbol?: ts.Symbol;
  identifier?: string;
};

export const getImportsAndExports = (sourceFile: BoundSourceFile, options: Options) => {
  const internalImports: Imports = new Map();
  const externalImports: Set<string> = new Set();
  const unresolvedImports: Set<string> = new Set();
  const exports: ExportItems = new Map();
  const aliasedExports: Record<string, string[]> = {};

  const importedInternalSymbols: Map<ts.Symbol, string> = new Map();

  const addImport = ({ specifier, symbol, identifier = '__anonymous' }: AddImportOptions) => {
    if (isBuiltin(specifier)) return;

    const module = sourceFile.resolvedModules?.get(specifier, /* mode */ undefined);

    if (module?.resolvedModule) {
      const filePath = module.resolvedModule.resolvedFileName;
      if (filePath) {
        if (module.resolvedModule.isExternalLibraryImport) {
          if (ast.isDeclarationFileExtension(module.resolvedModule.extension)) {
            // We use TypeScript's module resolution, but it returns @types/pkg. In the rest of the program we want the
            // package name based on the original specifier.
            externalImports.add(specifier);
          } else {
            externalImports.add(module.resolvedModule.packageId?.name ?? specifier);
          }
        } else {
          const isStar = identifier === '*';
          const isReExported = Boolean(isStar && !symbol);

          if (!internalImports.has(filePath)) {
            internalImports.set(filePath, {
              specifier,
              isStar,
              isReExported,
              isReExportedBy: new Set(),
              symbols: new Set(),
            });
          }

          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const internalImport = internalImports.get(filePath)!;

          if (isReExported) {
            internalImport.isReExported = isReExported;
            internalImport.isReExportedBy.add(sourceFile.fileName);
          }

          if (isStar) {
            internalImport.isStar = isStar;
          }

          if (!isStar) {
            internalImport.symbols.add(identifier);
          }

          if (isStar && symbol) {
            // Store imported namespace symbol for reference in `maybeAddNamespaceAccessAsImport`
            importedInternalSymbols.set(symbol, filePath);
          }
        }
      }
    } else {
      unresolvedImports.add(specifier);
    }
  };

  /**
   * Perhaps odd to try this for every obj.prop access, but it's cheaper to pretend `import * as NS from 'mod';
   * NS.exportValue` was imported as `exportValue` directly. Otherwise we have to find references to `exportValue`
   * across the program later on. More namespaces, more gains, easily up to ~10% in total running time.
   */
  const maybeAddNamespaceAccessAsImport = ({ namespace, member }: { namespace: string; member: string }) => {
    const symbol = sourceFile.locals?.get(namespace);
    if (symbol) {
      const importedSymbolFilePath = importedInternalSymbols.get(symbol);
      if (importedSymbolFilePath) {
        const internalImport = internalImports.get(importedSymbolFilePath);
        // The referenced imported namespace member is the exported identifier
        internalImport?.symbols.add(member);
      }
    }
  };

  const addExport = ({ node, identifier, type, pos, members }: ExportItem & { identifier: string }) => {
    if (options.skipExports) return;
    if (exports.has(identifier)) {
      const item = exports.get(identifier);
      exports.set(identifier, { ...item, node, type, pos, members });
    } else {
      exports.set(identifier, { node, type, pos, members });
    }
  };

  const addAliasedExport = (symbol: string, alias: string) => {
    aliasedExports[symbol] = aliasedExports[symbol] ?? [symbol];
    aliasedExports[symbol].push(alias);
  };

  const maybeAddAliasedExport = (node: ts.Node | undefined, alias: string) => {
    if (node && ts.isIdentifier(node) && sourceFile.symbol?.exports?.has(node.getText())) {
      addAliasedExport(node.getText(), alias);
    }
  };

  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteralLike(node.moduleSpecifier)) {
      const specifier = node.moduleSpecifier.text;
      if (!node.importClause) {
        // Pattern: import 'side-effects';
        addImport({ specifier });
      } else {
        if (node.importClause.isTypeOnly && options.skipTypeOnly) return;

        if (ast.isDefaultImport(node)) {
          // Pattern: import identifer from 'specifier'
          addImport({ specifier, identifier: 'default' });
        }

        if (node.importClause?.namedBindings) {
          if (ts.isNamespaceImport(node.importClause.namedBindings)) {
            // Pattern: import * as NS from 'specifier'
            // @ts-expect-error TODO FIXME Property 'symbol' does not exist on type 'NamespaceImport'.
            const symbol = node.importClause.namedBindings.symbol;
            addImport({ symbol, specifier, identifier: '*' });
          }
          if (ts.isNamedImports(node.importClause.namedBindings)) {
            // Pattern: import { identifer as NS } from 'specifier'
            node.importClause.namedBindings.elements.forEach(element => {
              const identifier = (element.propertyName ?? element.name).getText();
              // @ts-expect-error TODO FIXME Property 'symbol' does not exist on type 'ImportSpecifier'.
              addImport({ symbol: element.symbol, specifier, identifier });
            });
          }
        }
      }
    }

    if (ast.isImportCall(node)) {
      if (node.arguments[0] && ts.isStringLiteralLike(node.arguments[0])) {
        const specifier = node.arguments[0].text;
        let _node = node.parent;

        while (_node) {
          if (ts.isExpressionStatement(_node)) {
            // Pattern (side-effects import call):
            // import('polyfill');
            addImport({ specifier });
            break;
          }

          if (_node.parent && ts.isCallExpression(_node.parent)) {
            // e.g. inside a call such as Promise.all()
            addImport({ specifier, identifier: 'default' });
            break;
          }

          if (ast.isAccessExpression(_node)) {
            // Patterns:
            // import('specifier').then();
            // (import('specifier')).identifier;
            // (import('specifier'))['identifier']
            const identifier = ast.getAccessExpressionName(_node);
            const isPromiseLike = identifier === 'then';
            const symbol = isPromiseLike ? 'default' : identifier;
            addImport({ identifier: symbol, specifier });
            break;
          }

          if (ast.isVariableDeclarationList(_node)) {
            const variableDeclarations = ast.findDescendants<ts.VariableDeclaration>(_node, _node =>
              ts.isVariableDeclaration(_node)
            );

            variableDeclarations.forEach(variableDeclaration => {
              if (ts.isIdentifier(variableDeclaration.name)) {
                addImport({ identifier: 'default', specifier });
              } else {
                const binds = ast.findDescendants<ts.BindingElement>(variableDeclaration, _node =>
                  ts.isBindingElement(_node)
                );
                binds.forEach(element => {
                  const symbol = element.propertyName?.getText() || element.name.getText();
                  addImport({ identifier: symbol, specifier });
                });
              }
            });
            break;
          }

          _node = _node.parent;
        }
      }
    }

    if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      ts.isStringLiteralLike(node.moduleReference.expression)
    ) {
      // Pattern: import identifier = require('specifier')
      const specifier = node.moduleReference.expression.text;
      addImport({ specifier, identifier: 'default' });
    }

    if (ast.isRequireCall(node)) {
      if (ts.isStringLiteralLike(node.arguments[0])) {
        const specifier = node.arguments[0].text;

        if (specifier) {
          const propertyAccessExpression = ast.findAncestor<ts.PropertyAccessExpression>(node, _node => {
            if (ts.isExpressionStatement(_node) || ts.isCallExpression(_node)) return 'STOP';
            return ts.isPropertyAccessExpression(_node);
          });

          if (propertyAccessExpression) {
            // Pattern: require('side-effects').identifier
            const identifier = String(propertyAccessExpression.name.escapedText);
            addImport({ identifier, specifier });
          } else {
            const variableDeclaration = node.parent;
            if (
              ts.isVariableDeclaration(variableDeclaration) &&
              ts.isVariableDeclarationList(variableDeclaration.parent)
            ) {
              if (ts.isIdentifier(variableDeclaration.name)) {
                // Pattern: identifier = require('specifier')
                addImport({ identifier: 'default', specifier });
              } else {
                const binds = ast.findDescendants<ts.BindingElement>(variableDeclaration, _node =>
                  ts.isBindingElement(_node)
                );
                if (binds.length > 0) {
                  // Pattern: { identifier } = require('specifier')
                  binds.forEach(element => {
                    const identifier = (element.propertyName ?? element.name).getText();
                    addImport({ identifier, specifier });
                  });
                } else {
                  // Pattern: require('specifier')
                  addImport({ identifier: 'default', specifier });
                }
              }
            } else {
              // Pattern: require('side-effects')
              addImport({ identifier: 'default', specifier });
            }
          }
        }
      }
    }

    if (ast.isRequireResolveCall(node)) {
      // Pattern: require.resolve('specifier')
      if (node.arguments[0] && ts.isStringLiteralLike(node.arguments[0])) {
        const specifier = node.arguments[0].text;
        if (specifier) {
          addImport({ specifier });
        }
      }
    }

    // @ts-expect-error TODO Property 'modifiers' does not exist on type 'Node'.
    const modifierKinds = (node.modifiers as ts.Modifier[])?.map(modifier => modifier.kind) ?? [];

    if (ts.isExportAssignment(node)) {
      // Patterns:
      // export default 1;
      // export = identifier;
      addExport({ node, identifier: 'default', type: 'unknown', pos: node.expression.getStart() });
      maybeAddAliasedExport(node.expression, 'default');
    }

    if (modifierKinds.includes(ts.SyntaxKind.ExportKeyword)) {
      if (ts.isVariableStatement(node)) {
        node.declarationList.declarations.forEach(declaration => {
          if (ts.isObjectBindingPattern(declaration.name)) {
            // Pattern: export const { name1, name2 } = {};
            declaration.name.elements.forEach(element => {
              if (ts.isIdentifier(element.name)) {
                addExport({
                  node: element,
                  identifier: element.name.escapedText.toString(),
                  type: 'unknown',
                  pos: element.name.getStart(),
                });
              }
            });
          } else if (ts.isArrayBindingPattern(declaration.name)) {
            // Pattern: export const [name1, name2] = [];
            declaration.name.elements.forEach(element => {
              if (ts.isBindingElement(element)) {
                addExport({
                  node: element,
                  identifier: element.getText(),
                  type: 'unknown',
                  pos: element.getStart(),
                });
              }
            });
          } else {
            // Pattern: export const MyVar = 1;
            const identifier = declaration.name.getText();
            addExport({ node: declaration, identifier, type: 'unknown', pos: declaration.name.getStart() });
            maybeAddAliasedExport(declaration.initializer, identifier);
          }
        });
      }

      if (ts.isFunctionDeclaration(node) && node.name) {
        const identifier = modifierKinds.includes(ts.SyntaxKind.DefaultKeyword) ? 'default' : node.name.getText();
        const pos = (node.name ?? node.body ?? node).getStart();
        addExport({ node, identifier, pos, type: 'function' });
      }

      if (ts.isClassDeclaration(node) && node.name) {
        const identifier = modifierKinds.includes(ts.SyntaxKind.DefaultKeyword) ? 'default' : node.name.getText();
        const pos = (node.name ?? node).getStart();
        const members = node.members
          .filter(
            (member): member is ts.MethodDeclaration | ts.PropertyDeclaration =>
              (ts.isPropertyDeclaration(member) || ts.isMethodDeclaration(member)) && !ast.isPrivateMember(member)
          )
          .map(n => ({ node: n, identifier: n.name.getText(), pos: n.name.getStart(), type: 'member' }));
        addExport({ node, identifier, type: 'class', pos, members });
      }

      if (ts.isTypeAliasDeclaration(node)) {
        addExport({ node, identifier: node.name.getText(), type: 'type', pos: node.name.getStart() });
      }

      if (ts.isInterfaceDeclaration(node)) {
        addExport({ node, identifier: node.name.getText(), type: 'interface', pos: node.name.getStart() });
      }

      if (ts.isEnumDeclaration(node)) {
        const identifier = modifierKinds.includes(ts.SyntaxKind.DefaultKeyword) ? 'default' : node.name.getText();
        const pos = node.name.getStart();
        const members = node.members.map(n => ({
          node: n,
          identifier: ast.stripQuotes(n.name.getText()),
          pos: n.name.getStart(),
          type: 'member',
        }));
        addExport({ node, identifier, type: 'enum', pos, members });
      }
    }

    if (ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) {
        // Re-exports
        if (!node.exportClause) {
          // Pattern: export * from 'specifier';
          addImport({ identifier: '*', specifier: node.moduleSpecifier.text });
        } else if (node.exportClause.kind === ts.SyntaxKind.NamespaceExport) {
          // Pattern: export * as namespace from 'specifier';
          addImport({ identifier: '*', specifier: node.moduleSpecifier.text });
        } else {
          // Pattern: export { identifier, identifier2 } from 'specifier';
          const specifier = node.moduleSpecifier; // Assign to satisfy TS
          node.exportClause.elements.forEach(element => {
            const identifier = (element.propertyName ?? element.name).getText();
            addImport({ identifier, specifier: specifier.text });
          });
        }
      } else if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        // Pattern: export { identifier, identifier2 }; export type { Identifier, Identifier2 };
        const type = node.isTypeOnly ? 'type' : 'unknown';
        node.exportClause.elements.forEach(element => {
          addExport({ node: element, identifier: element.name.getText(), type, pos: element.name.pos });
        });
      }
    }

    // module.exports
    if (ast.isModuleExportsAccessExpression(node)) {
      const parent = node.parent;
      if (ts.isPropertyAccessExpression(parent)) {
        // module.exports.NAME
        const identifier = parent.name.getText();
        const pos = parent.name.getStart();
        addExport({ node, identifier, type: 'unknown', pos });
      } else if (ts.isElementAccessExpression(parent)) {
        // module.exports['NAME']
        const identifier = ast.stripQuotes(parent.argumentExpression.getText());
        const pos = parent.argumentExpression.getStart();
        addExport({ node, identifier, type: 'unknown', pos });
      } else if (ts.isBinaryExpression(parent)) {
        const expr = parent.right;
        if (ts.isObjectLiteralExpression(expr) && expr.properties.every(ts.isShorthandPropertyAssignment)) {
          // Pattern: module.exports = { identifier, identifier2 }
          expr.properties.forEach(node => {
            addExport({ node, identifier: node.getText(), type: 'unknown', pos: node.pos });
          });
        } else {
          // Pattern: module.exports = any
          addExport({ node, identifier: 'default', type: 'unknown', pos: node.getStart() });
        }
      }
    }

    if ('jsDoc' in node) {
      const type = ts.getJSDocType(node);
      if (type && ast.isValidImportTypeNode(type)) {
        // TODO Odd to assume this is an `import()` call?
        addImport({ specifier: type.argument.literal.text });
      }
    }

    if (ast.isAccessExpression(node)) {
      maybeAddNamespaceAccessAsImport({
        namespace: node.expression.getText(),
        member: ast.getAccessExpressionName(node),
      });
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  // TODO Remove duplicates from unused exports? This behavior is now different from v1 (yet more clear/actionable?)
  const duplicateExports = Object.values(aliasedExports);

  return {
    imports: {
      internal: internalImports,
      external: externalImports,
      unresolved: unresolvedImports,
    },
    exports,
    duplicateExports,
  };
};
