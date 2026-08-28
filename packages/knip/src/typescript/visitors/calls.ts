import type { CallExpression, NewExpression, VariableDeclarator } from 'oxc-parser';
import { IMPORT_FLAGS, OPAQUE } from '../../constants.ts';
import { addValue } from '../../util/module-graph.ts';
import { getSafeScriptFromArgs, getScriptFromArg, getStringValue, isStringLiteral } from '../ast-nodes.ts';
import { isShadowed, type WalkState } from './walk.ts';

/**
 * Credits the class registered by a native custom-element call `<registry>.define('tag', Class)`. The
 * registry is the global `customElements`, a `<host>.customElements` (window/globalThis/self or a
 * shadow-root scoped registry), or a local alias / `new CustomElementRegistry()` instance. The class is
 * an Identifier, or `this` self-registered in a `static {}` block. Returns undefined when the registry or
 * class binding is locally shadowed.
 */
function getRegisteredCustomElement(node: CallExpression, s: WalkState): string | undefined {
  const callee = node.callee;
  if (callee.type !== 'MemberExpression' || callee.computed) return undefined;
  if (callee.property.type !== 'Identifier' || callee.property.name !== 'define') return undefined;

  const object = callee.object;
  let isRegistry: boolean;
  if (object.type === 'Identifier') {
    isRegistry =
      (object.name === 'customElements' || s.customElementRegistries.has(object.name)) &&
      !isShadowed(object.name, object.start);
  } else {
    isRegistry =
      object.type === 'MemberExpression' &&
      !object.computed &&
      object.property.type === 'Identifier' &&
      object.property.name === 'customElements';
  }
  if (!isRegistry) return undefined;

  const arg = node.arguments[1];
  if (arg?.type === 'Identifier') return isShadowed(arg.name, arg.start) ? undefined : arg.name;
  if (arg?.type === 'ThisExpression' && s.staticBlockDepth > 0)
    return s.classNameStack[s.classNameStack.length - 1] || undefined;
  return undefined;
}

/**
 * Tracks locals bound to a custom-element registry — `const r = customElements` (or
 * `<host>.customElements`) and `const r = new CustomElementRegistry()` — so a later
 * `r.define('tag', Class)` credits the class.
 */
export function trackCustomElementRegistry(node: VariableDeclarator, s: WalkState) {
  if (node.id.type !== 'Identifier' || !node.init) return;
  const init = node.init;
  if (
    (init.type === 'Identifier' && init.name === 'customElements' && !isShadowed('customElements', init.start)) ||
    (init.type === 'MemberExpression' &&
      !init.computed &&
      init.property.type === 'Identifier' &&
      init.property.name === 'customElements') ||
    (init.type === 'NewExpression' && init.callee.type === 'Identifier' && init.callee.name === 'CustomElementRegistry')
  ) {
    s.customElementRegistries.add(node.id.name);
  }
}

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

const getMockedExports = (factory: unknown): string[] => {
  const names: string[] = [];
  const collect = (obj: unknown) => {
    if (!obj || typeof obj !== 'object' || (obj as any).type !== 'ObjectExpression') return;
    for (const prop of (obj as any).properties) {
      if (prop.type === 'Property' && !prop.computed) {
        if (prop.key.type === 'Identifier') names.push(prop.key.name);
        else if (prop.key.type === 'StringLiteral') names.push(String(prop.key.value));
      }
    }
  };
  if (!factory || typeof factory !== 'object') return names;
  const node = factory as any;
  if (node.type === 'ObjectExpression') {
    collect(node);
  } else if (node.type === 'ArrowFunctionExpression') {
    if (node.body.type === 'ObjectExpression') collect(node.body);
    else if (node.body.type === 'BlockStatement') {
      for (const stmt of node.body.body) {
        if (stmt.type === 'ReturnStatement' && stmt.argument?.type === 'ObjectExpression') {
          collect(stmt.argument);
          break;
        }
      }
    }
  }
  return names;
};

const CHILD_PROCESS_FILE_METHODS = new Set(['fork', 'spawn', 'spawnSync', 'execFile', 'execFileSync']);
const CHILD_PROCESS_COMMAND_METHODS = new Set(['exec', 'execSync']);

function getChildProcessMethod(node: CallExpression, s: WalkState): string | undefined {
  const callee = node.callee;
  if (callee.type === 'Identifier') return s.childProcessMethods.get(callee.name);
  if (
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.object.type === 'Identifier' &&
    callee.property.type === 'Identifier' &&
    s.childProcessNamespaces.has(callee.object.name)
  )
    return callee.property.name;
  return undefined;
}

export function handleCallExpression(node: CallExpression, s: WalkState) {
  if (node.arguments.length >= 2) {
    const registered = getRegisteredCustomElement(node, s);
    if (registered) {
      s.registeredCustomElements.add(registered);
      return;
    }
  }

  if (
    node.arguments.length >= 2 &&
    node.callee.type === 'MemberExpression' &&
    !node.callee.computed &&
    node.callee.object.type === 'Identifier' &&
    node.callee.object.name === 'vi' &&
    node.callee.property.type === 'Identifier' &&
    node.callee.property.name === 'mock' &&
    node.arguments[0]?.type === 'ImportExpression' &&
    isStringLiteral(node.arguments[0].source)
  ) {
    const importExpr = node.arguments[0];
    const specifier = getStringValue(importExpr.source)!;
    s.handledImportExpressions.add(importExpr.start);
    // The import() only points Vitest at the module to mock; it does not mean every
    // real export is used. Register the module (so the file is not reported unused)
    // and only the exports enumerated by the mock factory.
    s.addImport(specifier, undefined, undefined, undefined, importExpr.source.start, IMPORT_FLAGS.NONE);
    for (const name of getMockedExports(node.arguments[1])) {
      s.addImport(specifier, name, undefined, undefined, importExpr.source.start, IMPORT_FLAGS.NONE);
    }
    return;
  }

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
    const method = getChildProcessMethod(node, s);
    if (method) {
      const arg = node.arguments[0];
      if (CHILD_PROCESS_COMMAND_METHODS.has(method)) {
        const command = getScriptFromArg(arg);
        if (command) s.scripts.add(command);
        return;
      }
      if (CHILD_PROCESS_FILE_METHODS.has(method)) {
        const specifier = extractInlineDirnamePath(arg, s);
        if (specifier) {
          s.addImport(specifier, undefined, undefined, undefined, arg.start, IMPORT_FLAGS.ENTRY);
          return;
        }
        if (method !== 'fork') {
          const script = getSafeScriptFromArgs(arg, node.arguments[1]);
          if (script) {
            s.scripts.add(script);
            return;
          }
        }
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
    else if (arg.type === 'ArrowFunctionExpression' && arg.expression) {
      const body = arg.body.type === 'AwaitExpression' ? arg.body.argument : arg.body;
      if (body.type === 'ImportExpression' && isStringLiteral(body.source)) {
        s.handledImportExpressions.add(body.start);
        const specifier = getStringValue(body.source)!;
        s.addImport(
          specifier,
          undefined,
          undefined,
          undefined,
          body.source.start,
          IMPORT_FLAGS.DYNAMIC | IMPORT_FLAGS.LOADER
        );
      }
    } else if (arg.type === 'ArrayExpression') {
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
