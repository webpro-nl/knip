import type { Expression, ImportExpression, VariableDeclarator } from 'oxc-parser';
import { IMPORT_FLAGS, IMPORT_STAR, OPAQUE } from '../../constants.ts';
import { addValue } from '../../util/module-graph.ts';
import { isInNodeModules } from '../../util/path.ts';
import { getStringValue, isStringLiteral } from './helpers.ts';
import type { WalkState } from './walk.ts';

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
    s.handledImportExpressions.add(importExpr.start);
    const specifier = getStringValue(importExpr.source)!;

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
          s.addImport(specifier, importedName, alias, undefined, prop.key?.start ?? prop.start, IMPORT_FLAGS.NONE);
        } else if (prop.type === 'RestElement' && prop.argument?.type === 'Identifier') {
          s.addImport(specifier, IMPORT_STAR, prop.argument.name, undefined, prop.start, IMPORT_FLAGS.NONE);
        }
      }
    } else if (node.id.type === 'Identifier') {
      if (init.type === 'AwaitExpression') {
        s.addImport(specifier, 'default', node.id.name, undefined, importExpr.source.start, IMPORT_FLAGS.NONE);
        const resolved = s.resolveModule(specifier, s.filePath);
        if (resolved && !resolved.isExternalLibraryImport && !isInNodeModules(resolved.resolvedFileName)) {
          s.localImportMap.set(node.id.name, {
            importedName: IMPORT_STAR,
            filePath: resolved.resolvedFileName,
            isNamespace: true,
            isDynamicImport: true,
          });
        }
      } else {
        s.addImport(specifier, undefined, undefined, undefined, importExpr.source.start, IMPORT_FLAGS.OPAQUE);
      }
    } else {
      s.addImport(specifier, undefined, undefined, undefined, importExpr.source.start, IMPORT_FLAGS.OPAQUE);
    }
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

  if (
    init.type === 'AwaitExpression' &&
    init.argument.type === 'CallExpression' &&
    init.argument.callee.type === 'MemberExpression' &&
    !init.argument.callee.computed &&
    init.argument.callee.object.type === 'Identifier' &&
    init.argument.callee.object.name === 'Promise' &&
    init.argument.callee.property.name === 'all' &&
    init.argument.arguments[0]?.type === 'ArrayExpression' &&
    node.id.type === 'ArrayPattern'
  ) {
    const imports = init.argument.arguments[0].elements;
    const bindings = node.id.elements;
    for (let i = 0; i < imports.length; i++) {
      const imp = imports[i];
      const binding = bindings[i];
      if (imp?.type === 'ImportExpression' && isStringLiteral(imp.source)) {
        s.handledImportExpressions.add(imp.start);
        const specifier = getStringValue(imp.source)!;
        if (binding?.type === 'ObjectPattern') {
          for (const prop of binding.properties) {
            if (prop.type === 'Property') {
              const importedName =
                prop.key?.type === 'Identifier'
                  ? prop.key.name
                  : prop.key?.type === 'Literal' && typeof prop.key.value === 'string'
                    ? prop.key.value
                    : undefined;
              s.addImport(
                specifier,
                importedName,
                undefined,
                undefined,
                prop.key?.start ?? prop.start,
                IMPORT_FLAGS.NONE
              );
            }
          }
        } else if (binding?.type === 'Identifier') {
          s.addImport(specifier, 'default', binding.name, undefined, imp.source.start, IMPORT_FLAGS.NONE);
        } else {
          s.addImport(specifier, undefined, undefined, undefined, imp.source.start, IMPORT_FLAGS.SIDE_EFFECTS);
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
        if (prop.type === 'Property' && prop.shorthand && prop.value?.type === 'Identifier') {
          const _import = s.localImportMap.get(prop.value.name);
          if (_import?.isNamespace) {
            const internalImport = s.internal.get(_import.filePath);
            if (internalImport) internalImport.refs.add(prop.value.name);
            let set = s.shorthandNsContainers.get(aliasName);
            if (!set) {
              set = new Set();
              s.shorthandNsContainers.set(aliasName, set);
            }
            set.add(prop.value.name);
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
          if (_import.isDynamicImport) {
            for (const prop of node.id.properties) {
              if (prop.type === 'Property' && prop.key?.type === 'Identifier') {
                addValue(internalImport.import, prop.key.name, s.filePath);
              } else if (prop.type === 'RestElement') {
                addValue(internalImport.import, OPAQUE, s.filePath);
              }
            }
          } else {
            const ns = _import.isNamespace ? rootName : _import.importedName;
            const prefix = [ns, ...memberPath].join('.');
            for (const prop of node.id.properties) {
              if (prop.type === 'Property' && prop.key?.type === 'Identifier') {
                internalImport.refs.add(`${prefix}.${prop.key.name}`);
              } else if (prop.type === 'RestElement') {
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

export function handleImportExpression(node: ImportExpression, s: WalkState) {
  if (s.handledImportExpressions.has(node.start)) return;
  const specifier = getStringValue(node.source);
  if (specifier) {
    s.addImport(specifier, undefined, undefined, undefined, node.source.start, IMPORT_FLAGS.OPAQUE);
  }
}
