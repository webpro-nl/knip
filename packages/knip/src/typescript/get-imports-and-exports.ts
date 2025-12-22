import { isBuiltin } from 'node:module';
import ts from 'typescript';
import { ALIAS_TAG, IMPORT_FLAGS, IMPORT_STAR, OPAQUE, PROTOCOL_VIRTUAL, SIDE_EFFECTS } from '../constants.js';
import type { GetImportsAndExportsOptions, IgnoreExportsUsedInFile } from '../types/config.js';
import type { ExportNode, ExportNodeMember } from '../types/exports.js';
import type { ImportNode } from '../types/imports.js';
import type { IssueSymbol } from '../types/issues.js';
import type { ExportMap, ExportMember, FileNode, ImportMap, ImportMaps, Imports } from '../types/module-graph.js';
import { addNsValue, addValue, createImports } from '../util/module-graph.js';
import { getPackageNameFromFilePath, isStartsLikePackageName, sanitizeSpecifier } from '../util/modules.js';
import { timerify } from '../util/Performance.js';
import { dirname, isInNodeModules, resolve } from '../util/path.js';
import { shouldIgnore } from '../util/tag.js';
import {
  getAccessMembers,
  getDestructuredNames,
  getJSDocTags,
  getLineAndCharacterOfPosition,
  getTypeRef,
  isAccessExpression,
  isConsiderReferencedNS,
  isDestructuring,
  isImportSpecifier,
  isInForIteration,
  isObjectEnumerationCallExpressionArgument,
  isReferencedInExport,
} from './ast-helpers.js';
import { findInternalReferences, isType } from './find-internal-references.js';
import { getImportsFromPragmas } from './pragmas/index.js';
import type { BoundSourceFile } from './SourceFile.js';
import getDynamicImportVisitors from './visitors/dynamic-imports/index.js';
import getExportVisitors from './visitors/exports/index.js';
import getImportVisitors from './visitors/imports/index.js';
import getScriptVisitors from './visitors/scripts/index.js';

const getVisitors = (sourceFile: ts.SourceFile) => ({
  export: getExportVisitors(sourceFile),
  import: getImportVisitors(sourceFile),
  dynamicImport: getDynamicImportVisitors(sourceFile),
  script: getScriptVisitors(sourceFile),
});

const createMember = (node: ts.Node, member: ExportNodeMember, pos: number): ExportMember => {
  const { line, character } = node.getSourceFile().getLineAndCharacterOfPosition(pos);
  return {
    // @ts-expect-error ref will be unset later
    symbol: member.node.symbol,
    identifier: member.identifier,
    type: member.type,
    pos: member.pos,
    line: line + 1,
    col: character + 1,
    fix: member.fix,
    self: [0, false],
    jsDocTags: getJSDocTags(member.node),
    flags: member.flags,
  };
};

interface AddInternalImportOptions extends ImportNode {
  filePath: string;
  line: number;
  col: number;
}

const getImportsAndExports = (
  sourceFile: BoundSourceFile,
  resolveModule: (specifier: string) => ts.ResolvedModuleFull | undefined,
  typeChecker: ts.TypeChecker,
  options: GetImportsAndExportsOptions,
  ignoreExportsUsedInFile: IgnoreExportsUsedInFile,
  skipExportsForFile: boolean
): FileNode => {
  const skipExports = skipExportsForFile || !options.isReportExports;
  const internal: ImportMap = new Map();
  const external: Imports = new Set();
  const unresolved: Imports = new Set();
  const programFiles = new Set<string>();
  const entryFiles = new Set<string>();
  const imports: Imports = new Set();
  const exports: ExportMap = new Map();
  const aliasedExports = new Map<string, IssueSymbol[]>();
  const scripts = new Set<string>();

  const importedInternalSymbols = new Map<ts.Symbol, string>();

  const importAliases = new Map<string, Set<{ id: string; filePath: string }>>();
  const addImportAlias = (aliasName: string, id: string, filePath: string) => {
    const aliases = importAliases.get(aliasName);
    if (aliases) aliases.add({ id, filePath });
    else importAliases.set(aliasName, new Set([{ id, filePath }]));
  };

  const referencedSymbolsInExport = new Set<ts.Symbol>();

  const visitors = getVisitors(sourceFile);

  const addNsMemberRefs = (internalImport: ImportMaps, namespace: string, member: string | string[]) => {
    if (typeof member === 'string') {
      internalImport.refs.add(`${namespace}.${member}`);
    } else {
      for (const m of member) {
        internalImport.refs.add(`${namespace}.${m}`);
      }
    }
  };

  const maybeAddAliasedExport = (node: ts.Expression | undefined, alias: string) => {
    const identifier = node?.getText();
    if (node && identifier) {
      const symbol = sourceFile.symbol?.exports?.get(identifier);
      if (symbol?.valueDeclaration) {
        if (!aliasedExports.has(identifier)) {
          const pos = getLineAndCharacterOfPosition(symbol.valueDeclaration, symbol.valueDeclaration.pos);
          aliasedExports.set(identifier, [{ symbol: identifier, ...pos }]);
        }
        const aliasedExport = aliasedExports.get(identifier);
        if (aliasedExport) {
          const pos = getLineAndCharacterOfPosition(node, node.pos);
          aliasedExport.push({ symbol: alias, ...pos });
        }
      }
    }
  };

  const addInternalImport = (options: AddInternalImportOptions) => {
    const { symbol, filePath, namespace, specifier, modifiers } = options;

    const identifier = options.identifier ?? (modifiers & IMPORT_FLAGS.OPAQUE ? OPAQUE : SIDE_EFFECTS);

    const isStar = identifier === IMPORT_STAR;

    imports.add({
      filePath,
      specifier,
      identifier: namespace ?? options.identifier,
      pos: options.pos,
      line: options.line,
      col: options.col,
      isTypeOnly: !!(modifiers & IMPORT_FLAGS.TYPE_ONLY),
    });

    const file = internal.get(filePath);

    const importMaps = file ?? createImports();

    if (!file) internal.set(filePath, importMaps);

    const nsOrAlias = symbol ? String(symbol.escapedName) : options.alias;

    if (modifiers & IMPORT_FLAGS.RE_EXPORT) {
      if (isStar && namespace) {
        // Pattern: export * as NS from 'specifier';
        addValue(importMaps.reExportedNs, namespace, sourceFile.fileName);
      } else if (nsOrAlias) {
        // Pattern: export { id as alias } from 'specifier';
        addNsValue(importMaps.reExportedAs, identifier, nsOrAlias, sourceFile.fileName);
      } else {
        // Patterns:
        // export { id } from 'specifier';
        // export * from 'specifier';
        // module.exports = require('specifier');
        addValue(importMaps.reExported, identifier, sourceFile.fileName);
      }
    } else {
      if (nsOrAlias && nsOrAlias !== identifier) {
        if (isStar) {
          addValue(importMaps.importedNs, nsOrAlias, sourceFile.fileName);
        } else {
          addNsValue(importMaps.importedAs, identifier, nsOrAlias, sourceFile.fileName);
        }
      } else if (identifier !== IMPORT_STAR) {
        addValue(importMaps.imported, identifier, sourceFile.fileName);
      }

      if (symbol) importedInternalSymbols.set(symbol, filePath);
    }
  };

  const addImport = (opts: ImportNode, node: ts.Node) => {
    if (isBuiltin(opts.specifier)) return;

    const module = resolveModule(opts.specifier);

    if (module) {
      const filePath = module.resolvedFileName;
      if (filePath) {
        if (!isInNodeModules(filePath)) {
          if (opts.modifiers & IMPORT_FLAGS.ENTRY) entryFiles.add(filePath);
          if (opts.modifiers & IMPORT_FLAGS.BRIDGE) programFiles.add(filePath);
        }

        if (!module.isExternalLibraryImport || !isInNodeModules(filePath)) {
          const { line, character } = node.getSourceFile().getLineAndCharacterOfPosition(opts.pos);
          addInternalImport({
            ...opts,
            filePath,
            line: line + 1,
            col: character + 1,
          });
        }

        if (module.isExternalLibraryImport) {
          if (options.skipTypeOnly && opts.modifiers & IMPORT_FLAGS.TYPE_ONLY) return;

          const sanitizedSpecifier = sanitizeSpecifier(
            isInNodeModules(filePath) || isInNodeModules(opts.specifier)
              ? getPackageNameFromFilePath(opts.specifier)
              : opts.specifier
          );

          if (!isStartsLikePackageName(sanitizedSpecifier)) {
            // Import maps and other exceptions, examples from tests: #dep, #internals/used, $app/stores
            return;
          }

          // @ts-expect-error ts.ImportDeclaration
          const pos = node.moduleSpecifier?.getStart() ?? opts.pos; // switch from identifier → specifier pos
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(pos);
          external.add({
            filePath,
            specifier: sanitizedSpecifier,
            identifier: opts.identifier ?? SIDE_EFFECTS,
            pos,
            line: line + 1,
            col: character + 2,
            isTypeOnly: !!(opts.modifiers & IMPORT_FLAGS.TYPE_ONLY),
          });
        }
      }
    } else {
      if (options.skipTypeOnly && opts.modifiers & IMPORT_FLAGS.TYPE_ONLY) return;
      if (shouldIgnore(getJSDocTags(node), options.tags)) return;
      if (opts.specifier.startsWith(PROTOCOL_VIRTUAL)) return;

      if (opts.modifiers && opts.modifiers & IMPORT_FLAGS.OPTIONAL) {
        programFiles.add(resolve(dirname(sourceFile.fileName), opts.specifier));
        return;
      }

      // @ts-expect-error TODO
      const pos = 'moduleSpecifier' in node ? node.moduleSpecifier.pos : node.pos;
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(pos);
      unresolved.add({
        filePath: undefined,
        specifier: opts.specifier,
        identifier: opts.identifier ?? SIDE_EFFECTS,
        pos,
        line: line + 1,
        col: character + 2,
        isTypeOnly: !!(opts.modifiers & IMPORT_FLAGS.TYPE_ONLY),
      });
    }
  };

  const addExport = ({ node, symbol, identifier, type, pos, members, fix }: ExportNode) => {
    let isReExport = Boolean(
      node.parent?.parent && ts.isExportDeclaration(node.parent.parent) && node.parent.parent.moduleSpecifier
    );

    if (symbol) {
      const importedSymbolFilePath = importedInternalSymbols.get(symbol);
      if (importedSymbolFilePath) {
        isReExport = true;
        const importId = String(symbol.escapedName);
        const internalImport = internal.get(importedSymbolFilePath);
        if (internalImport) {
          if (importId !== identifier) {
            // Pattern: import { id as alias } from 'specifier'; export = id; export default id;
            // Pattern: import * as NS from 'specifier'; export { NS as aliased }
            addNsValue(internalImport.reExportedAs, importId, identifier, sourceFile.fileName);
          } else if (symbol.declarations && ts.isNamespaceImport(symbol.declarations[0])) {
            // Pattern: import * as NS from 'specifier'; export { NS };
            addValue(internalImport.reExportedNs, identifier, sourceFile.fileName);
          } else {
            // Pattern: import { id } from 'specifier'; export { id };
            addValue(internalImport.reExported, importId, sourceFile.fileName);
          }
        }
      }
    }

    const jsDocTags = getJSDocTags(node);

    const exportMembers = members.map(member => createMember(node, member, member.pos));

    const item = exports.get(identifier);
    if (item) {
      // Code path for fn overloads, simple merge
      const members = [...item.members, ...exportMembers];
      const tags = new Set([...item.jsDocTags, ...jsDocTags]);
      const fixes = fix ? [...item.fixes, fix] : item.fixes;
      exports.set(identifier, { ...item, members, jsDocTags: tags, fixes, isReExport });
    } else {
      const { line, character } = node.getSourceFile().getLineAndCharacterOfPosition(pos);
      exports.set(identifier, {
        identifier,
        // @ts-expect-error ref will be unset later
        symbol: node.symbol,
        type,
        members: exportMembers,
        jsDocTags,
        pos,
        line: line + 1,
        col: character + 1,
        fixes: fix ? [fix] : [],
        self: [0, false],
        isReExport,
      });
    }

    if (!jsDocTags.has(ALIAS_TAG)) {
      if (ts.isExportAssignment(node)) maybeAddAliasedExport(node.expression, 'default');
      if (ts.isVariableDeclaration(node)) maybeAddAliasedExport(node.initializer, identifier);
    }
  };

  const addScript = (script: string) => scripts.add(script);

  const getImport = (id: string, node: ts.Identifier | ts.ImportEqualsDeclaration) => {
    const local = sourceFile.locals?.get(id);
    // @ts-expect-error Quick way to get import symbol for identifier while dealing with name conflicts
    const symbol = node.symbol ?? node.parent.symbol ?? local;
    const filePath = importedInternalSymbols.get(symbol) ?? (local && importedInternalSymbols.get(local));
    return { symbol, filePath };
  };

  const visit = (node: ts.Node) => {
    const addImportWithNode = (result: ImportNode) => addImport(result, node);

    // @ts-expect-error Skip work by handling only top-level import/export assignments
    const isTopLevel = node !== sourceFile && ts.isInTopLevelContext(node);

    if (isTopLevel) {
      for (const visitor of visitors.import) {
        const result = visitor(node, options);
        result && (Array.isArray(result) ? result.forEach(addImportWithNode) : addImportWithNode(result));
      }

      if (!skipExports) {
        for (const visitor of visitors.export) {
          const result = visitor(node, options);
          result && (Array.isArray(result) ? result.forEach(addExport) : addExport(result));
        }
      }

      if (
        ts.isImportEqualsDeclaration(node) &&
        ts.isQualifiedName(node.moduleReference) &&
        ts.isIdentifier(node.moduleReference.left)
      ) {
        // Pattern: import name = NS.identifier
        const { left, right } = node.moduleReference;
        const namespace = left.text;
        const { filePath } = getImport(namespace, node);
        if (filePath) {
          const internalImport = internal.get(filePath);
          if (internalImport) addNsMemberRefs(internalImport, namespace, right.text);
        }
      }
    }

    for (const visitor of visitors.dynamicImport) {
      const result = visitor(node, options);
      result && (Array.isArray(result) ? result.forEach(addImportWithNode) : addImportWithNode(result));
    }

    for (const visitor of visitors.script) {
      const result = visitor(node, options);
      result && (Array.isArray(result) ? result.forEach(addScript) : addScript(result));
    }

    // Populate `refs` to imported symbols during a single pass for the current file
    // The imported symbols have been added by AST visitors
    // The `refs` will be used by `explorer.isReferenced` and `explorer.hasStrictlyNsReferences` to find unused exports
    // Regular imports are ignored (unused imports is for file-based linters); `refs` is for namespaces, members, etc.
    if (ts.isIdentifier(node)) {
      const id = String(node.escapedText);
      const { symbol, filePath } = getImport(id, node);

      if (importAliases.has(id) && isAccessExpression(node.parent)) {
        // Pattern: const alias = cond ? NS1 : NS2; alias.member
        // Pattern: const spread = { ...NS }; spread.member
        // Pattern: const assign = NS; assign.member
        const members = getAccessMembers(typeChecker, node);
        // biome-ignore lint/style/noNonNullAssertion: deal with it
        for (const { id: aliasedId, filePath: aliasFilePath } of importAliases.get(id)!) {
          const aliasImports = internal.get(aliasFilePath);
          if (aliasImports) addNsMemberRefs(aliasImports, aliasedId, members);
        }
      }

      if (symbol) {
        if (filePath) {
          if (!isImportSpecifier(node)) {
            const imports = internal.get(filePath);
            if (imports) {
              const isPropName = ts.isPropertyAccessExpression(node.parent) && node.parent.name === node;
              if (isPropName && isAccessExpression(node.parent.parent)) {
                // Pattern: alias.NS.identifier
                const members = getAccessMembers(typeChecker, node.parent);
                addNsMemberRefs(imports, id, members);
              } else if (isAccessExpression(node.parent) && !isPropName) {
                if (isDestructuring(node.parent)) {
                  if (ts.isPropertyAccessExpression(node.parent)) {
                    // Pattern: const { id, ...id } = NS.sub;
                    const ns = String(symbol.escapedName);
                    const key = String(node.parent.name.escapedText);
                    const [members, hasSpread] = getDestructuredNames(
                      // @ts-expect-error safe after isDestructuring
                      node.parent.parent.name
                    );
                    if (hasSpread) imports.refs.add(id);
                    else {
                      const ids = members.map(id => `${key}.${id}`);
                      addNsMemberRefs(imports, ns, key);
                      addNsMemberRefs(imports, ns, ids);
                    }
                  }
                } else {
                  // Patterns: NS.id, NS['id'], NS.sub.id, NS[TypeId], etc.
                  const members = getAccessMembers(typeChecker, node);
                  addNsMemberRefs(imports, id, members);
                }
              } else if (isDestructuring(node)) {
                // Pattern: const { id, ...id } = NS;
                // @ts-expect-error safe after isDestructuring
                const [members, hasSpread] = getDestructuredNames(node.parent.name);
                if (hasSpread) imports.refs.add(id);
                else addNsMemberRefs(imports, id, members);
              } else if (ts.isSpreadAssignment(node.parent)) {
                // Pattern: export const named = { ...id };
                // Pattern: export const named = { ns: { ...id } };
                // Pattern: const spread = { ...NS }; spread.member;
                const path: string[] = [];
                let _node: ts.Node = node.parent;
                while (_node && !ts.isVariableDeclaration(_node)) {
                  if (ts.isPropertyAssignment(_node) && ts.isIdentifier(_node.name)) path.unshift(_node.name.text);
                  _node = _node.parent;
                }
                if (_node && ts.isIdentifier(_node.name)) {
                  const varName = _node.name.text;
                  if (exports.has(varName)) {
                    addNsValue(imports.reExportedAs, id, [varName, ...path].join('.'), sourceFile.fileName);
                  } else if (path.length === 0) {
                    // Pattern: const spread = { ...NS }; spread.member
                    addImportAlias(varName, id, filePath);
                  }
                }
                imports.refs.add(id);
              } else {
                const typeRef = getTypeRef(node);
                if (typeRef) {
                  if (ts.isQualifiedName(typeRef.typeName)) {
                    const typeName = typeRef.typeName;
                    // Pattern: NS.TypeId
                    const [ns, ...right] = [typeName.left.getText(), typeName.right.getText()].join('.').split('.');
                    const members = right.map((_r, index) => right.slice(0, index + 1).join('.'));
                    addNsMemberRefs(imports, ns, members);
                  } else {
                    imports.refs.add(id);
                  }
                } else if (
                  ts.isVariableDeclaration(node.parent) &&
                  node.parent.initializer === node &&
                  ts.isIdentifier(node.parent.name)
                ) {
                  // Pattern: const alias = NS;
                  const aliasName = node.parent.name.text;
                  if (exports.has(aliasName)) {
                    // Pattern: export const alias = NS;
                    addNsValue(imports.reExportedAs, id, aliasName, sourceFile.fileName);
                  } else {
                    // Pattern: const alias = NS; alias.member
                    addImportAlias(aliasName, id, filePath);
                    imports.refs.add(id);
                  }
                } else if (ts.isConditionalExpression(node.parent) || ts.isBinaryExpression(node.parent)) {
                  // Pattern: const x = cond ? NS1 : NS2; x.member
                  // Pattern: const x = NS1 || NS2; x.member
                  let _node: ts.Node = node.parent;
                  while (_node && !ts.isVariableDeclaration(_node)) _node = _node.parent;
                  if (_node && ts.isIdentifier(_node.name)) addImportAlias(_node.name.text, id, filePath);
                  imports.refs.add(id);
                } else if (ts.isShorthandPropertyAssignment(node.parent)) {
                  // Pattern: const hello = { NS }; hello.NS.member
                  let _node: ts.Node = node.parent;
                  while (_node && !ts.isVariableDeclaration(_node)) _node = _node.parent;
                  if (_node && ts.isIdentifier(_node.name)) addImportAlias(`${_node.name.text}.${id}`, id, filePath);
                  imports.refs.add(id);
                } else if (imports.importedNs.has(id) && isConsiderReferencedNS(node)) {
                  // Pattern: fn(NS), { ...NS } etc. (https://knip.dev/guides/namespace-imports)
                  imports.refs.add(id);
                } else if (isObjectEnumerationCallExpressionArgument(node)) {
                  // Pattern: Object.keys(NS)
                  imports.refs.add(id);
                } else if (isInForIteration(node)) {
                  // Pattern: for (const x in NS) { }
                  // Pattern: for (const x of NS) { }
                  imports.refs.add(id);
                }
              }
            }
          }
        }

        // Store exports referenced in exported types, including `typeof` values
        // Simplifies and speeds up (*) below while we still have the typeChecker
        if (!isTopLevel && symbol.exportSymbol && isReferencedInExport(node)) {
          referencedSymbolsInExport.add(symbol.exportSymbol);
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  // Collect imports from file pragmas/docblocks
  // Pattern: /** @jsxImportSource preact */
  // Pattern: /// <reference types="astro/client" />)
  // Pattern: /** @vitest-environment jsdom */
  const pragmaImports = getImportsFromPragmas(sourceFile);
  if (pragmaImports) for (const node of pragmaImports) addImport(node, sourceFile);

  // If `ignoreExportsUsedInFile` is set, see for each export if it's referenced in this same file,
  // and if it's referenced in an exported type and therefore should be exported with it (*)
  for (const item of exports.values()) {
    // TODO Reconsider this messy logic in AST visitors + `isReferencedInExport` + `findInternalReferences`
    if (!isType(item) && item.symbol && referencedSymbolsInExport.has(item.symbol)) {
      item.self = [1, true];
    } else {
      const isBindingElement = item.symbol?.valueDeclaration && ts.isBindingElement(item.symbol.valueDeclaration);
      if (
        ignoreExportsUsedInFile === true ||
        (typeof ignoreExportsUsedInFile === 'object' &&
          item.type !== 'unknown' &&
          ignoreExportsUsedInFile[item.type]) ||
        isBindingElement
      ) {
        item.self = findInternalReferences(item, sourceFile, typeChecker, referencedSymbolsInExport, isBindingElement);
      }
    }

    for (const member of item.members) {
      member.self = findInternalReferences(member, sourceFile, typeChecker, referencedSymbolsInExport);
      member.symbol = undefined;
    }

    item.symbol = undefined;
  }

  return {
    imports: { internal, external, externalRefs: new Set(), programFiles, entryFiles, imports, unresolved },
    exports,
    duplicates: [...aliasedExports.values()],
    scripts,
    imported: undefined,
    internalImportCache: undefined,
  };
};

export const _getImportsAndExports = timerify(getImportsAndExports);
