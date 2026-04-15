import type { CallExpression, NewExpression } from 'oxc-parser';
import { IMPORT_FLAGS, OPAQUE } from '../../constants.ts';
import { addValue } from '../../util/module-graph.ts';
import { getStringValue, isStringLiteral } from './helpers.ts';
import type { WalkState } from './walk.ts';

function extractInlineDirnamePath(node: any, s: WalkState): string | undefined {
  if (node?.type !== 'CallExpression') return undefined;
  const callee = node.callee;
  let isPathHelper = false;
  if (
    callee?.type === 'MemberExpression' &&
    !callee.computed &&
    callee.object?.type === 'Identifier' &&
    callee.object.name === 'path' &&
    callee.property?.type === 'Identifier' &&
    (callee.property.name === 'join' || callee.property.name === 'resolve')
  ) {
    isPathHelper = true;
  } else if (callee?.type === 'Identifier') {
    if (callee.name === 'join' && s.hasPathJoinImport) isPathHelper = true;
    else if (callee.name === 'resolve' && s.hasPathResolveImport) isPathHelper = true;
  }
  if (!isPathHelper) return undefined;
  const args = node.arguments;
  if (!args || args.length < 2) return undefined;
  if (args[0]?.type !== 'Identifier' || args[0].name !== '__dirname') return undefined;
  const parts: string[] = [];
  for (let i = 1; i < args.length; i++) {
    if (!isStringLiteral(args[i])) return undefined;
    const value = getStringValue(args[i]);
    if (value == null) return undefined;
    parts.push(value);
  }
  if (parts.length === 0) return undefined;
  const joined = parts.join('/').replace(/\/+/g, '/');
  return joined.startsWith('.') || joined.startsWith('/') ? joined : `./${joined}`;
}

const CHILD_PROCESS_ENTRY_METHODS = new Set(['fork', 'spawn', 'execFile']);

export function handleCallExpression(node: CallExpression, s: WalkState) {
  if (
    node.callee.type === 'Identifier' &&
    node.callee.name === 'require' &&
    node.arguments.length === 1 &&
    isStringLiteral(node.arguments[0])
  ) {
    const specifier = getStringValue(node.arguments[0])!;
    const reqTags = s.currentVarDeclStart >= 0 ? s.getJSDocTags(s.currentVarDeclStart) : undefined;
    s.addImport(
      specifier,
      'default',
      undefined,
      undefined,
      node.arguments[0].start,
      IMPORT_FLAGS.NONE,
      undefined,
      reqTags
    );
    return;
  }

  if (
    node.callee.type === 'MemberExpression' &&
    node.callee.object.type === 'Identifier' &&
    node.callee.object.name === 'require' &&
    !node.callee.computed &&
    node.callee.property.name === 'resolve' &&
    node.arguments.length >= 1 &&
    isStringLiteral(node.arguments[0])
  ) {
    const specifier = getStringValue(node.arguments[0])!;
    s.addImport(specifier, undefined, undefined, undefined, node.arguments[0].start, IMPORT_FLAGS.ENTRY);
    return;
  }

  if (
    node.callee.type === 'MemberExpression' &&
    node.callee.object.type === 'MetaProperty' &&
    !node.callee.computed &&
    node.callee.property.name === 'resolve' &&
    node.arguments.length >= 1 &&
    isStringLiteral(node.arguments[0])
  ) {
    const specifier = getStringValue(node.arguments[0])!;
    s.addImport(specifier, undefined, undefined, undefined, node.arguments[0].start, IMPORT_FLAGS.ENTRY);
    return;
  }

  if (
    s.hasNodeModuleImport &&
    ((node.callee.type === 'MemberExpression' &&
      node.callee.object.type === 'Identifier' &&
      node.callee.object.name === 'module' &&
      !node.callee.computed &&
      node.callee.property.name === 'register') ||
      (node.callee.type === 'Identifier' && node.callee.name === 'register')) &&
    node.arguments.length >= 1 &&
    isStringLiteral(node.arguments[0])
  ) {
    const specifier = getStringValue(node.arguments[0])!;
    const arg1 = node.arguments[1];
    if (
      specifier &&
      (!specifier.startsWith('.') ||
        (arg1?.type === 'MemberExpression' &&
          !arg1.computed &&
          arg1.object.type === 'MetaProperty' &&
          arg1.property.name === 'url'))
    ) {
      s.addImport(specifier, undefined, undefined, undefined, node.arguments[0].start, IMPORT_FLAGS.ENTRY);
      return;
    }
  }

  if (s.hasChildProcessImport && node.arguments.length >= 1) {
    let isChildProcessEntry = false;
    if (node.callee.type === 'Identifier' && CHILD_PROCESS_ENTRY_METHODS.has(node.callee.name)) {
      isChildProcessEntry = true;
    } else if (
      node.callee.type === 'MemberExpression' &&
      !node.callee.computed &&
      node.callee.property.type === 'Identifier' &&
      CHILD_PROCESS_ENTRY_METHODS.has(node.callee.property.name)
    ) {
      isChildProcessEntry = true;
    }
    if (isChildProcessEntry) {
      const specifier = extractInlineDirnamePath(node.arguments[0], s);
      if (specifier) {
        s.addImport(specifier, undefined, undefined, undefined, node.arguments[0].start, IMPORT_FLAGS.ENTRY);
        return;
      }
    }
  }

  if (
    node.callee.type === 'MemberExpression' &&
    !node.callee.computed &&
    node.callee.object.type === 'Identifier' &&
    node.callee.object.name === 'Object' &&
    node.callee.property.type === 'Identifier' &&
    (node.callee.property.name === 'keys' ||
      node.callee.property.name === 'values' ||
      node.callee.property.name === 'entries' ||
      node.callee.property.name === 'getOwnPropertyNames')
  ) {
    for (const arg of node.arguments) {
      if (arg.type === 'Identifier') {
        const _import = s.localImportMap.get(arg.name);
        if (_import) {
          const internalImport = s.internal.get(_import.filePath);
          if (internalImport) {
            if (_import.isNamespace) addValue(internalImport.import, OPAQUE, s.filePath);
            else {
              internalImport.refs.add(arg.name);
              (internalImport.enumerated ??= new Set()).add(arg.name);
            }
          }
        }
      }
    }
    return;
  }

  const markRefIfNs = (name: string) => {
    const _import = s.localImportMap.get(name);
    if (_import?.isNamespace) {
      const internalImport = s.internal.get(_import.filePath);
      if (internalImport) internalImport.refs.add(name);
    }
  };
  for (const arg of node.arguments) {
    if (arg.type === 'Identifier') markRefIfNs(arg.name);
    else if (arg.type === 'ArrayExpression') {
      for (const el of arg.elements ?? []) {
        if (el?.type === 'Identifier') markRefIfNs(el.name);
      }
    } else if (arg.type === 'ObjectExpression') {
      for (const prop of arg.properties ?? []) {
        if (prop.type === 'Property' && !prop.computed && prop.value?.type === 'Identifier')
          markRefIfNs(prop.value.name);
        if (prop.type === 'SpreadElement' && prop.argument?.type === 'Identifier') markRefIfNs(prop.argument.name);
      }
    }
  }
}

export function handleNewExpression(node: NewExpression, s: WalkState) {
  if (
    node.callee.type === 'Identifier' &&
    node.callee.name === 'URL' &&
    node.arguments.length >= 2 &&
    isStringLiteral(node.arguments[0]) &&
    node.arguments[1].type === 'MemberExpression' &&
    !node.arguments[1].computed &&
    node.arguments[1].object.type === 'MetaProperty' &&
    node.arguments[1].property.name === 'url'
  ) {
    const specifier = getStringValue(node.arguments[0]);
    if (specifier)
      s.addImport(
        specifier,
        undefined,
        undefined,
        undefined,
        node.arguments[0].start,
        IMPORT_FLAGS.ENTRY | IMPORT_FLAGS.OPTIONAL
      );
    return;
  }

  if (
    s.hasWorkerThreadsImport &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'Worker' &&
    node.arguments.length >= 1
  ) {
    const specifier = extractInlineDirnamePath(node.arguments[0], s);
    if (specifier) {
      s.addImport(specifier, undefined, undefined, undefined, node.arguments[0].start, IMPORT_FLAGS.ENTRY);
    }
  }
}
