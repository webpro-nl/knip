import type {
  ExportNamedDeclaration,
  ExportDefaultDeclaration,
  ModuleExportName,
  ObjectExpression,
  TSExportAssignment,
  ExpressionStatement,
} from 'oxc-parser';
import { ALIAS_TAG, FIX_FLAGS, IMPORT_FLAGS, IMPORT_STAR, SYMBOL_TYPE } from '../../constants.ts';
import type { Fix } from '../../types/exports.ts';
import type { ExportMember } from '../../types/module-graph.ts';
import type { SymbolType } from '../../types/issues.ts';
import { addNsValue, addValue } from '../../util/module-graph.ts';
import {
  extractEnumMembers,
  extractNamespaceMembers,
  getLineAndCol,
  getStringValue,
  isStringLiteral,
} from './helpers.ts';
import { EMPTY_TAGS } from './jsdoc.ts';
import type { WalkState } from './walk.ts';

const getName = (n: ModuleExportName | null | undefined) => (n?.type === 'Identifier' ? n.name : undefined);

export function handleExportNamed(node: ExportNamedDeclaration, s: WalkState) {
  if (s.skipExports || s.isInNamespace(node)) return;

  if (node.source) {
    const declTags = s.getJSDocTags(node.start);
    for (const spec of node.specifiers) {
      const exportedName = getName(spec.exported) ?? getName(spec.local);
      if (exportedName) {
        const isType = node.exportKind === 'type' || spec.exportKind === 'type';
        const type = isType ? SYMBOL_TYPE.TYPE : SYMBOL_TYPE.UNKNOWN;
        const fix =
          (s.options.isFixExports && !isType) || (s.options.isFixTypes && isType)
            ? [spec.start, spec.end, FIX_FLAGS.OBJECT_BINDING | FIX_FLAGS.EMPTY_DECLARATION]
            : undefined;
        const specTags = s.getJSDocTags(spec.start);
        const tags = specTags.size ? new Set([...declTags, ...specTags]) : declTags;
        s.addExport(exportedName, type, spec.exported?.start ?? spec.start, [], fix as Fix, true, tags);
      }
    }
    return;
  }

  const decl = node.declaration;
  if (decl) {
    const exportStart = node.start;

    if (decl.type === 'VariableDeclaration') {
      for (const declarator of decl.declarations) {
        if (declarator.id.type === 'ObjectPattern') {
          for (const p of declarator.id.properties) {
            if (p.type === 'RestElement' && p.argument?.type === 'Identifier') {
              const name = p.argument.name;
              const fix: Fix = s.options.isFixExports ? [p.start, p.end, FIX_FLAGS.OBJECT_BINDING] : undefined;
              s.addExport(name, SYMBOL_TYPE.UNKNOWN, p.argument.start, [], fix, false, s.getJSDocTags(exportStart));
              s.destructuredExports.add(name);
            } else if (p.value?.type === 'Identifier') {
              const name = p.value.name;
              const fix: Fix = s.options.isFixExports ? [p.start, p.end, FIX_FLAGS.OBJECT_BINDING] : undefined;
              s.addExport(name, SYMBOL_TYPE.UNKNOWN, p.value.start, [], fix, false, s.getJSDocTags(exportStart));
              s.destructuredExports.add(name);
            } else if (p.value?.type === 'AssignmentPattern' && p.value.left?.type === 'Identifier') {
              const name = p.value.left.name;
              const fix: Fix = s.options.isFixExports ? [p.start, p.end, FIX_FLAGS.OBJECT_BINDING] : undefined;
              s.addExport(name, SYMBOL_TYPE.UNKNOWN, p.value.left.start, [], fix, false, s.getJSDocTags(exportStart));
              s.destructuredExports.add(name);
            }
          }
        } else if (declarator.id.type === 'ArrayPattern') {
          for (const el of declarator.id.elements) {
            if (el?.type === 'Identifier') {
              const fix: Fix = s.options.isFixExports ? [el.start, el.end, FIX_FLAGS.NONE] : undefined;
              s.addExport(el.name, SYMBOL_TYPE.UNKNOWN, el.start, [], fix, false, s.getJSDocTags(exportStart));
              s.destructuredExports.add(el.name);
            } else if (el?.type === 'RestElement' && el.argument?.type === 'Identifier') {
              const fix: Fix = s.options.isFixExports ? [el.start, el.end, FIX_FLAGS.NONE] : undefined;
              s.addExport(
                el.argument.name,
                SYMBOL_TYPE.UNKNOWN,
                el.argument.start,
                [],
                fix,
                false,
                s.getJSDocTags(exportStart)
              );
              s.destructuredExports.add(el.argument.name);
            }
          }
        } else if (declarator.id.type === 'Identifier') {
          const name = declarator.id.name;
          const fix = s.getFix(exportStart, exportStart + 7);
          const jsDocTags = s.getJSDocTags(exportStart);

          let isReExport = false;
          if (declarator.init?.type === 'Identifier') {
            const _import = s.localImportMap.get(declarator.init.name);
            if (_import) {
              isReExport = true;
              const internalImport = s.internal.get(_import.filePath);
              if (internalImport) {
                if (_import.isNamespace) {
                  addValue(internalImport.reExportNs, name, s.filePath);
                } else if (_import.importedName !== name) {
                  addNsValue(internalImport.reExportAs, _import.importedName, name, s.filePath);
                } else {
                  addValue(internalImport.reExport, _import.importedName, s.filePath);
                }
              }
            }
          }

          if (declarator.init?.type === 'ObjectExpression') {
            const findSpreads = (obj: ObjectExpression, path: string[]) => {
              for (const prop of obj.properties) {
                if (prop.type === 'SpreadElement' && prop.argument?.type === 'Identifier') {
                  const _import = s.localImportMap.get(prop.argument.name);
                  if (_import) {
                    isReExport = true;
                    const internalImport = s.internal.get(_import.filePath);
                    if (internalImport) {
                      addNsValue(internalImport.reExportAs, prop.argument.name, path.join('.'), s.filePath);
                    }
                    s.accessedAliases.add(name);
                  }
                } else if (
                  prop.type === 'Property' &&
                  prop.value?.type === 'ObjectExpression' &&
                  prop.key?.type === 'Identifier'
                ) {
                  findSpreads(prop.value, [...path, prop.key.name]);
                }
              }
            };
            findSpreads(declarator.init, [name]);
          }

          s.addExport(name, SYMBOL_TYPE.UNKNOWN, declarator.id.start, [], fix, isReExport, jsDocTags);

          if (!jsDocTags.has(ALIAS_TAG) && declarator.init?.type === 'Identifier') {
            const initName = declarator.init.name;
            const existingExport = s.exports.get(initName);
            if (existingExport && !existingExport.isReExport) {
              if (!s.aliasedExports.has(initName)) {
                s.aliasedExports.set(initName, [
                  { symbol: initName, pos: existingExport.pos, line: existingExport.line, col: existingExport.col },
                ]);
              }
              const aliased = s.aliasedExports.get(initName);
              if (aliased) {
                const { line: l, col: c } = getLineAndCol(s.lineStarts, declarator.id.start);
                aliased.push({ symbol: name, pos: declarator.id.start, line: l, col: c });
              }
            }
          }
        }
      }
    } else if ((decl.type === 'FunctionDeclaration' || decl.type === 'TSDeclareFunction') && decl.id) {
      const fix = s.getFix(exportStart, exportStart + 7);
      s.addExport(decl.id.name, SYMBOL_TYPE.FUNCTION, decl.id.start, [], fix, false, s.getJSDocTags(exportStart));
    } else if (decl.type === 'ClassDeclaration' && decl.id) {
      const fix = s.getFix(exportStart, exportStart + 7);
      s.addExport(decl.id.name, SYMBOL_TYPE.CLASS, decl.id.start, [], fix, false, s.getJSDocTags(exportStart));
    } else if (decl.type === 'TSTypeAliasDeclaration') {
      const fix = s.getTypeFix(exportStart, exportStart + 7);
      s.addExport(decl.id.name, SYMBOL_TYPE.TYPE, decl.id.start, [], fix, false, s.getJSDocTags(exportStart));
      s.collectRefsInType(decl.typeAnnotation, decl.id.name, false);
    } else if (decl.type === 'TSInterfaceDeclaration') {
      const fix = s.getTypeFix(exportStart, exportStart + 7);
      s.addExport(decl.id.name, SYMBOL_TYPE.INTERFACE, decl.id.start, [], fix, false, s.getJSDocTags(exportStart));
      s.collectRefsInType(decl.body, decl.id.name, false);
      for (const ext of decl.extends ?? []) {
        if (ext.expression?.type === 'Identifier') s.addRefInExport(ext.expression.name, decl.id.name);
      }
    } else if (decl.type === 'TSEnumDeclaration') {
      const members = extractEnumMembers(decl, s.options, s.lineStarts, s.getJSDocTags);
      const fix = s.getTypeFix(exportStart, exportStart + 7);
      s.addExport(decl.id.name, SYMBOL_TYPE.ENUM, decl.id.start, members, fix, false, s.getJSDocTags(exportStart));
    } else if (decl.type === 'TSModuleDeclaration' && decl.kind !== 'global' && decl.id.type === 'Identifier') {
      const members = extractNamespaceMembers(decl, s.options, s.lineStarts, s.getJSDocTags);
      const fix = s.getFix(exportStart, exportStart + 7);
      s.addExport(decl.id.name, SYMBOL_TYPE.NAMESPACE, decl.id.start, members, fix, false, s.getJSDocTags(exportStart));
    }
  }

  if (node.specifiers && !node.source) {
    for (const spec of node.specifiers) {
      const exportedName = getName(spec.exported) ?? getName(spec.local);
      const localName = getName(spec.local);
      const isType = node.exportKind === 'type' || spec.exportKind === 'type';
      const type = isType ? SYMBOL_TYPE.TYPE : SYMBOL_TYPE.UNKNOWN;
      const fix =
        (s.options.isFixExports && !isType) || (s.options.isFixTypes && isType)
          ? [spec.start, spec.end, FIX_FLAGS.OBJECT_BINDING | FIX_FLAGS.EMPTY_DECLARATION]
          : undefined;

      const _import = localName ? s.localImportMap.get(localName) : undefined;
      const isReExport = !!_import;

      if (_import) {
        const internalImport = s.internal.get(_import.filePath);
        if (internalImport) {
          if (_import.isNamespace) {
            addValue(internalImport.reExportNs, exportedName!, s.filePath);
          } else if (_import.importedName !== exportedName) {
            addNsValue(internalImport.reExportAs, _import.importedName, exportedName!, s.filePath);
          } else {
            addValue(internalImport.reExport, _import.importedName, s.filePath);
          }
        }
      }

      s.addExport(
        exportedName!,
        type,
        spec.exported?.start ?? spec.start,
        [],
        fix as Fix,
        isReExport,
        s.getJSDocTags(node.start)
      );
      if (exportedName) s.specifierExportNames.add(exportedName);
    }
  }
}

export function handleExportDefault(node: ExportDefaultDeclaration, s: WalkState) {
  if (s.skipExports || s.isInNamespace(node)) return;

  const decl = node.declaration;
  const hasDeclarationBody = decl.type === 'ClassDeclaration' || decl.type === 'FunctionDeclaration';
  const fix: Fix = s.options.isFixExports
    ? hasDeclarationBody
      ? [node.start, decl.start, FIX_FLAGS.NONE]
      : [node.start, node.end + 1, FIX_FLAGS.NONE]
    : undefined;

  let type: SymbolType = SYMBOL_TYPE.UNKNOWN;
  let pos = decl.start;
  let members: ExportMember[] = [];

  if (decl.type === 'FunctionDeclaration') {
    type = SYMBOL_TYPE.FUNCTION;
    pos = decl.id?.start ?? decl.start;
  } else if (decl.type === 'ClassDeclaration') {
    type = SYMBOL_TYPE.CLASS;
    pos = decl.id?.start ?? decl.start;
    members = [];
  } else if (decl.type === 'TSInterfaceDeclaration') {
    type = SYMBOL_TYPE.INTERFACE;
    pos = decl.id.start;
    s.collectRefsInType(decl.body, 'default', false);
  } else if (decl.type === 'Identifier') {
    type = s.localDeclarationTypes.get(decl.name) ?? SYMBOL_TYPE.UNKNOWN;
    pos = decl.start;
    const _import = s.localImportMap.get(decl.name);
    if (_import) {
      const internalImport = s.internal.get(_import.filePath);
      if (internalImport) {
        if (_import.importedName !== 'default') {
          addNsValue(internalImport.reExportAs, _import.importedName, 'default', s.filePath);
        } else {
          addValue(internalImport.reExport, 'default', s.filePath);
        }
      }
    }

    const jsDocTags = s.getJSDocTags(node.start);
    if (!jsDocTags.has(ALIAS_TAG) && !s.specifierExportNames.has(decl.name)) {
      const existingExport = s.exports.get(decl.name);
      if (existingExport) {
        if (!s.aliasedExports.has(decl.name)) {
          s.aliasedExports.set(decl.name, [
            { symbol: decl.name, pos: existingExport.pos, line: existingExport.line, col: existingExport.col },
          ]);
        }
        const aliased = s.aliasedExports.get(decl.name);
        if (aliased) {
          const { line: defLine, col: defCol } = getLineAndCol(s.lineStarts, decl.start);
          aliased.push({ symbol: 'default', pos: decl.start, line: defLine, col: defCol });
        }
      }
    }
  }

  s.addExport('default', type, pos, members, fix, false, s.getJSDocTags(node.start));
}

export function handleExportAssignment(node: TSExportAssignment, s: WalkState) {
  if (s.skipExports || s.isInNamespace(node)) return;
  const expr = node.expression;
  if (expr.type === 'Identifier') {
    const _import = s.localImportMap.get(expr.name);
    if (_import) {
      const internalImport = s.internal.get(_import.filePath);
      if (internalImport) {
        addNsValue(internalImport.reExportAs, expr.name, 'default', s.filePath);
        internalImport.refs.add(expr.name);
      }
      s.addExport('default', SYMBOL_TYPE.UNKNOWN, expr.start, [], undefined, true, s.getJSDocTags(node.start));
    } else {
      s.addExport('default', SYMBOL_TYPE.UNKNOWN, expr.start, [], undefined, false, s.getJSDocTags(node.start));
    }
  } else {
    s.addExport('default', SYMBOL_TYPE.UNKNOWN, expr.start, [], undefined, false, s.getJSDocTags(node.start));
  }
}

export function handleExpressionStatement(node: ExpressionStatement, s: WalkState) {
  if (node.expression.type === 'Identifier') {
    if (s.destructuredExports.has(node.expression.name)) s.bareExprRefs.add(node.expression.name);
  }
  if (!s.isJS) return;
  const expr = node.expression;
  if (expr.type !== 'AssignmentExpression' || expr.operator !== '=') return;
  const left = expr.left;

  if (left.type !== 'MemberExpression') return;

  if (!left.computed && left.object.type === 'Identifier' && left.object.name === 'exports') {
    if (s.skipExports) return;
    const name = left.property.name;
    if (name) {
      const fix: Fix = s.options.isFixExports ? [node.start, node.end, FIX_FLAGS.NONE] : undefined;
      s.addExport(name, SYMBOL_TYPE.UNKNOWN, left.property.start, [], fix, false, EMPTY_TAGS);
    }
    return;
  }

  if (
    left.object.type === 'MemberExpression' &&
    !left.object.computed &&
    left.object.object.type === 'Identifier' &&
    left.object.object.name === 'module' &&
    left.object.property.name === 'exports'
  ) {
    let exportName: string | undefined;
    if (!left.computed && left.property.type === 'Identifier') {
      exportName = left.property.name;
    } else if (left.computed && isStringLiteral(left.property)) {
      exportName = getStringValue(left.property);
    }

    if (exportName) {
      const right = expr.right;
      let isReExport = false;
      if (
        right.type === 'MemberExpression' &&
        right.object.type === 'CallExpression' &&
        right.object.callee.type === 'Identifier' &&
        right.object.callee.name === 'require' &&
        right.object.arguments.length === 1 &&
        isStringLiteral(right.object.arguments[0])
      ) {
        const specifier = getStringValue(right.object.arguments[0])!;
        let memberName: string | undefined;
        if (!right.computed && right.property.type === 'Identifier') memberName = right.property.name;
        else if (right.computed && isStringLiteral(right.property)) memberName = getStringValue(right.property);
        if (memberName) {
          const alias = exportName !== memberName ? exportName : undefined;
          s.addImport(specifier, memberName, alias, undefined, right.object.arguments[0].start, IMPORT_FLAGS.RE_EXPORT);
          isReExport = true;
        }
      }

      if (!s.skipExports) {
        const fix: Fix = s.options.isFixExports ? [node.start, node.end, FIX_FLAGS.NONE] : undefined;
        s.addExport(exportName, SYMBOL_TYPE.UNKNOWN, left.property.start, [], fix, isReExport, EMPTY_TAGS);
      }
    }
    return;
  }

  if (
    !left.computed &&
    left.object.type === 'Identifier' &&
    left.object.name === 'module' &&
    left.property.name === 'exports'
  ) {
    const right = expr.right;
    if (right.type === 'ObjectExpression') {
      if (s.skipExports) return;
      const props = right.properties;
      const allShorthand = props.length > 0 && props.every(p => p.type === 'Property' && p.shorthand);
      if (allShorthand) {
        for (const prop of props) {
          if (prop.type === 'Property' && prop.key.type === 'Identifier') {
            const fix: Fix = s.options.isFixExports ? [prop.start, prop.end, FIX_FLAGS.NONE] : undefined;
            s.addExport(prop.key.name, SYMBOL_TYPE.UNKNOWN, prop.key.start, [], fix, false, EMPTY_TAGS);
          }
        }
      } else {
        s.addExport('default', SYMBOL_TYPE.UNKNOWN, right.start, [], undefined, false, EMPTY_TAGS);
      }
      for (const prop of props) {
        if (
          prop.type === 'SpreadElement' &&
          prop.argument.type === 'CallExpression' &&
          prop.argument.callee.type === 'Identifier' &&
          prop.argument.callee.name === 'require' &&
          isStringLiteral(prop.argument.arguments[0])
        ) {
          const specifier = getStringValue(prop.argument.arguments[0])!;
          s.addImport(
            specifier,
            IMPORT_STAR,
            undefined,
            undefined,
            prop.argument.arguments[0].start,
            IMPORT_FLAGS.RE_EXPORT
          );
        }
      }
    } else if (
      right.type === 'CallExpression' &&
      right.callee.type === 'Identifier' &&
      right.callee.name === 'require'
    ) {
      if (isStringLiteral(right.arguments[0])) {
        const specifier = getStringValue(right.arguments[0])!;
        s.addImport(specifier, IMPORT_STAR, undefined, undefined, right.arguments[0].start, IMPORT_FLAGS.RE_EXPORT);
      }
    } else if (!s.skipExports) {
      s.addExport('default', SYMBOL_TYPE.UNKNOWN, right.start, [], undefined, false, EMPTY_TAGS);
    }
    return;
  }
}
