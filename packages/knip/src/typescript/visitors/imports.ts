import type {
  ArrayExpression,
  BindingPattern,
  CallExpression,
  Expression,
  ImportExpression,
  VariableDeclarator,
} from 'oxc-parser';
import { IMPORT_FLAGS, IMPORT_STAR, OPAQUE } from '../../constants.ts';
import { addValue } from '../../util/module-graph.ts';
import { isInNodeModules } from '../../util/path.ts';
import { getStringValue, isStringLiteral } from '../ast-nodes.ts';
import type { WalkState } from './walk.ts';

export function getPromiseAllElements(expression: Expression): ArrayExpression['elements'] | undefined {
  if (
    expression.type === 'CallExpression' &&
    expression.callee.type === 'MemberExpression' &&
    !expression.callee.computed &&
    expression.callee.object.type === 'Identifier' &&
    expression.callee.object.name === 'Promise' &&
    expression.callee.property.name === 'all' &&
    expression.arguments[0]?.type === 'ArrayExpression'
  ) {
    return expression.arguments[0].elements;
  }
}

export function handleVariableDeclarator(node: VariableDeclarator, s: WalkState) {
  const init = node.init;
  if (!init) return;
  let importExpr: ImportExpression | null = null;
  if (init.type === 'AwaitExpression' && init.argument.type === 'ImportExpression') {
    importExpr = init.argument;
  } else if (init.type === 'ImportExpression') {
    importExpr = init;
  }

  if (importExpr && isStringLiteral(importExpr.source)) {
    const caughtFlag =
      init.type === 'AwaitExpression' && s.caughtTryBlockEnds.length > 0 ? IMPORT_FLAGS.CAUGHT : IMPORT_FLAGS.NONE;
    handleDynamicImportBinding(node.id, importExpr, init.type === 'AwaitExpression', caughtFlag, s);
    return;
  }

  if (
    init.type === 'CallExpression' &&
    init.callee.type === 'Identifier' &&
    init.callee.name === 'require' &&
    init.arguments.length === 1 &&
    isStringLiteral(init.arguments[0])
  ) {
    const specifier = getStringValue(init.arguments[0])!;
    const reqTags = s.currentVarDeclStart >= 0 ? s.getJSDocTags(s.currentVarDeclStart) : undefined;
    if (node.id.type === 'ObjectPattern') {
      for (const prop of node.id.properties) {
        if (prop.type === 'Property') {
          const importedName =
            prop.key?.type === 'Identifier'
              ? prop.key.name
              : prop.key?.type === 'Literal' && typeof prop.key.value === 'string'
                ? prop.key.value
                : undefined;
          const localName = prop.value?.type === 'Identifier' ? prop.value.name : importedName;
          const alias = localName !== importedName ? localName : undefined;
          s.addImport(
            specifier,
            importedName,
            alias,
            undefined,
            prop.key?.start ?? prop.start,
            IMPORT_FLAGS.NONE,
            undefined,
            reqTags
          );
        } else if (prop.type === 'RestElement' && prop.argument?.type === 'Identifier') {
          s.addImport(
            specifier,
            IMPORT_STAR,
            prop.argument.name,
            undefined,
            prop.start,
            IMPORT_FLAGS.NONE,
            undefined,
            reqTags
          );
        }
      }
    } else if (node.id.type === 'Identifier') {
      s.addImport(
        specifier,
        'default',
        node.id.name,
        undefined,
        init.arguments[0].start,
        IMPORT_FLAGS.NONE,
        undefined,
        reqTags
      );
    } else {
      s.addImport(
        specifier,
        undefined,
        undefined,
        undefined,
        init.arguments[0].start,
        IMPORT_FLAGS.SIDE_EFFECTS,
        undefined,
        reqTags
      );
    }
    return;
  }

  const imports = init.type === 'AwaitExpression' ? getPromiseAllElements(init.argument) : undefined;
  if (imports && node.id.type === 'ArrayPattern') {
    const bindings = node.id.elements;
    for (let i = 0; i < imports.length; i++) {
      const imp = imports[i];
      if (imp?.type === 'SpreadElement') break;
      const binding = bindings[i];
      if (imp?.type === 'ImportExpression' && isStringLiteral(imp.source)) {
        s.handledImportExpressions.add(imp.start);
        const specifier = getStringValue(imp.source)!;
        const caughtFlag = s.caughtTryBlockEnds.length > 0 ? IMPORT_FLAGS.CAUGHT : IMPORT_FLAGS.NONE;
        if (binding?.type === 'ObjectPattern') {
          for (const prop of binding.properties) {
            if (prop.type === 'Property') {
              const importedName =
                prop.key?.type === 'Identifier'
                  ? prop.key.name
                  : prop.key?.type === 'Literal' && typeof prop.key.value === 'string'
                    ? prop.key.value
                    : undefined;
              s.addImport(specifier, importedName, undefined, undefined, prop.key?.start ?? prop.start, caughtFlag);
            }
          }
        } else if (binding?.type === 'Identifier') {
          s.addImport(
            specifier,
            'default',
            binding.name,
            undefined,
            imp.source.start,
            IMPORT_FLAGS.DYNAMIC | caughtFlag
          );
          const resolved = s.resolveModule(specifier, s.filePath);
          if (resolved && !resolved.isExternalLibraryImport && !isInNodeModules(resolved.resolvedFileName)) {
            s.localImportMap.set(binding.name, {
              importedName: IMPORT_STAR,
              filePath: resolved.resolvedFileName,
              isNamespace: true,
              isDynamicImport: true,
            });
          }
        } else {
          s.addImport(
            specifier,
            undefined,
            undefined,
            undefined,
            imp.source.start,
            IMPORT_FLAGS.DYNAMIC | IMPORT_FLAGS.SIDE_EFFECTS | caughtFlag
          );
        }
      }
    }
  }

  if (node.id.type === 'Identifier') {
    const aliasName = node.id.name;
    const registerAlias = (expr: Expression) => {
      if (expr?.type === 'Identifier') {
        const _import = s.localImportMap.get(expr.name);
        if (_import) {
          s.addImportAlias(aliasName, expr.name, _import.filePath);
          if (_import.isNamespace) {
            const internalImport = s.internal.get(_import.filePath);
            if (internalImport) internalImport.refs.add(expr.name);
          }
        }
      }
    };
    if (init.type === 'ConditionalExpression') {
      registerAlias(init.consequent);
      registerAlias(init.alternate);
    } else if (init.type === 'Identifier') {
      registerAlias(init);
    }

    if (init.type === 'ObjectExpression') {
      for (const prop of init.properties) {
        if (prop.type === 'SpreadElement' && prop.argument?.type === 'Identifier') {
          const _import = s.localImportMap.get(prop.argument.name);
          if (_import) {
            s.addImportAlias(aliasName, prop.argument.name, _import.filePath);
            if (_import.isNamespace) {
              const internalImport = s.internal.get(_import.filePath);
              if (internalImport) internalImport.refs.add(prop.argument.name);
            }
          }
        }
        if (
          prop.type === 'Property' &&
          !prop.computed &&
          prop.value?.type === 'Identifier' &&
          prop.key?.type === 'Identifier'
        ) {
          const nsName = prop.value.name;
          const _import = s.localImportMap.get(nsName);
          if (_import?.isNamespace) {
            const internalImport = s.internal.get(_import.filePath);
            if (internalImport) internalImport.refs.add(nsName);
            let map = s.nsContainers.get(aliasName);
            if (!map) {
              map = new Map();
              s.nsContainers.set(aliasName, map);
            }
            map.set(prop.key.name, nsName);
          }
        }
      }
    }
  }

  if (node.id.type === 'ObjectPattern') {
    let rootName: string | undefined;
    let memberPath: string[] = [];
    if (init.type === 'Identifier') {
      rootName = init.name;
    } else if (init.type === 'MemberExpression' && !init.computed) {
      const parts: string[] = [];
      let cur: Expression = init;
      while (cur.type === 'MemberExpression' && !cur.computed && cur.property.type === 'Identifier') {
        parts.unshift(cur.property.name);
        cur = cur.object;
      }
      if (cur.type === 'Identifier') {
        rootName = cur.name;
        memberPath = parts;
      }
    }
    if (rootName) {
      const _import = s.localImportMap.get(rootName);
      if (_import) {
        const internalImport = s.internal.get(_import.filePath);
        if (internalImport) {
          if (_import.isDynamicImport && memberPath.length === 0) {
            for (const prop of node.id.properties) {
              if (prop.type === 'Property' && prop.key?.type === 'Identifier') {
                addValue(internalImport.import, prop.key.name, s.filePath);
              } else if (prop.type === 'RestElement') {
                addValue(internalImport.import, OPAQUE, s.filePath);
              }
            }
          } else if (!_import.isDynamicImport) {
            const ns = _import.isNamespace ? rootName : _import.importedName;
            const prefix = [ns, ...memberPath].join('.');
            const isNsRoot = _import.isNamespace && memberPath.length === 0;
            for (const prop of node.id.properties) {
              if (prop.type === 'Property' && prop.key?.type === 'Identifier') {
                internalImport.refs.add(`${prefix}.${prop.key.name}`);
              } else if (prop.type === 'RestElement' && isNsRoot) {
                addValue(internalImport.import, OPAQUE, s.filePath);
              }
            }
          }
        }
      }
    }

    for (const prop of node.id.properties) {
      if (prop.type === 'Property' && prop.value?.type === 'AssignmentPattern') {
        const defaultValue = prop.value.right;
        if (defaultValue?.type === 'Identifier') {
          const _import = s.localImportMap.get(defaultValue.name);
          if (_import) {
            const internalImport = s.internal.get(_import.filePath);
            if (internalImport) {
              if (_import.isNamespace) addValue(internalImport.import, OPAQUE, s.filePath);
              else internalImport.refs.add(defaultValue.name);
            }
            if (prop.value.left?.type === 'Identifier') {
              s.addImportAlias(prop.value.left.name, defaultValue.name, _import.filePath);
            }
          }
        }
      }
    }
  }
}

function handleDynamicImportBinding(
  id: BindingPattern,
  importExpr: ImportExpression,
  isAwaited: boolean,
  caughtFlag: number,
  s: WalkState
) {
  s.handledImportExpressions.add(importExpr.start);
  const specifier = getStringValue(importExpr.source)!;
  if (id.type === 'ObjectPattern') {
    for (const prop of id.properties) {
      if (prop.type === 'Property') {
        const importedName =
          prop.key?.type === 'Identifier'
            ? prop.key.name
            : prop.key?.type === 'Literal' && typeof prop.key.value === 'string'
              ? prop.key.value
              : undefined;
        const localName = prop.value?.type === 'Identifier' ? prop.value.name : importedName;
        const alias = localName !== importedName ? localName : undefined;
        s.addImport(
          specifier,
          importedName,
          alias,
          undefined,
          prop.key?.start ?? prop.start,
          IMPORT_FLAGS.DYNAMIC | caughtFlag
        );
      } else if (prop.type === 'RestElement' && prop.argument?.type === 'Identifier') {
        s.addImport(
          specifier,
          IMPORT_STAR,
          prop.argument.name,
          undefined,
          prop.start,
          IMPORT_FLAGS.DYNAMIC | caughtFlag
        );
      }
    }
  } else if (id.type === 'Identifier') {
    if (isAwaited) {
      s.addImport(specifier, 'default', id.name, undefined, importExpr.source.start, IMPORT_FLAGS.DYNAMIC | caughtFlag);
      const resolved = s.resolveModule(specifier, s.filePath);
      if (resolved && !resolved.isExternalLibraryImport && !isInNodeModules(resolved.resolvedFileName)) {
        s.localImportMap.set(id.name, {
          importedName: IMPORT_STAR,
          filePath: resolved.resolvedFileName,
          isNamespace: true,
          isDynamicImport: true,
        });
      }
    } else {
      s.addImport(
        specifier,
        undefined,
        undefined,
        undefined,
        importExpr.source.start,
        IMPORT_FLAGS.DYNAMIC | IMPORT_FLAGS.OPAQUE | caughtFlag
      );
    }
  } else {
    s.addImport(
      specifier,
      undefined,
      undefined,
      undefined,
      importExpr.source.start,
      IMPORT_FLAGS.DYNAMIC | IMPORT_FLAGS.OPAQUE | caughtFlag
    );
  }
}

export function handleImportThen(node: CallExpression, s: WalkState) {
  const callee = node.callee;
  if (callee.type !== 'MemberExpression' || callee.computed || callee.property.name !== 'then') return;
  if (callee.object.type !== 'ImportExpression' || !isStringLiteral(callee.object.source)) return;
  const fn = node.arguments[0];
  if (fn?.type !== 'ArrowFunctionExpression' && fn?.type !== 'FunctionExpression') return;
  const param = fn.params[0];
  if (param?.type !== 'Identifier' && param?.type !== 'ObjectPattern') return;
  const caughtFlag = s.caughtImportExpressions.has(callee.object.start) ? IMPORT_FLAGS.CAUGHT : IMPORT_FLAGS.NONE;
  handleDynamicImportBinding(param, callee.object, true, caughtFlag, s);
}

export function handleImportExpression(node: ImportExpression, s: WalkState) {
  if (s.handledImportExpressions.has(node.start)) return;
  const specifier = getStringValue(node.source);
  if (specifier) {
    const caughtFlag = s.caughtImportExpressions.has(node.start) ? IMPORT_FLAGS.CAUGHT : IMPORT_FLAGS.NONE;
    s.addImport(
      specifier,
      undefined,
      undefined,
      undefined,
      node.source.start,
      IMPORT_FLAGS.DYNAMIC | IMPORT_FLAGS.OPAQUE | caughtFlag
    );
  }
}
