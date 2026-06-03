import type { Class, ImportDeclaration } from 'oxc-parser';
import type { PluginVisitorContext, PluginVisitorObject } from '../../types/config.ts';

/**
 * Shared Web Components decorator detection for framework plugins (Lit, FAST, …). Each framework
 * registers a class as a custom element with a `@customElement('tag')` decorator of the same shape;
 * only the import specifier providing `customElement` differs. A plugin supplies `isRegistrationSpecifier`
 * and the rest (import tracking, scope gating, marking) is shared. Lives under `_custom-elements`
 * (`_`-prefixed → not a plugin itself).
 */

/** Whether `node` carries a `@customElement(...)` decorator bound to a tracked `customElement` import. */
function isCustomElementDecorated(
  node: Class,
  names: ReadonlySet<string>,
  namespaces: ReadonlySet<string>
): boolean {
  const decorators = node.decorators;
  if (!decorators || decorators.length === 0) return false;
  for (const decorator of decorators) {
    const expression = decorator.expression;
    if (expression?.type !== 'CallExpression') continue;
    const callee = expression.callee;
    if (callee.type === 'Identifier') {
      if (names.has(callee.name)) return true;
    } else if (
      callee.type === 'MemberExpression' &&
      !callee.computed &&
      callee.object.type === 'Identifier' &&
      callee.property.type === 'Identifier' &&
      callee.property.name === 'customElement' &&
      namespaces.has(callee.object.name)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Builds a visitor that credits classes decorated with `@customElement('tag')` as used (bare, aliased,
 * and `@ns.customElement(...)` forms), validated against `isRegistrationSpecifier`. State is per-file
 * (reset on `Program`); only module-level class declarations are credited (block scope is tracked).
 * A locally-defined `customElement` (absent from a matching import) does not match.
 */
export function createCustomElementDecoratorVisitor(
  ctx: PluginVisitorContext,
  isRegistrationSpecifier: (specifier: string) => boolean
): PluginVisitorObject {
  let names = new Set<string>();
  let namespaces = new Set<string>();
  let depth = 0;

  const trackImport = (node: ImportDeclaration) => {
    if (!node.source || !isRegistrationSpecifier(node.source.value)) return;
    for (const spec of node.specifiers ?? []) {
      if (
        spec.type === 'ImportSpecifier' &&
        spec.imported.type === 'Identifier' &&
        spec.imported.name === 'customElement'
      )
        names.add(spec.local.name);
      else if (spec.type === 'ImportNamespaceSpecifier') namespaces.add(spec.local.name);
    }
  };

  return {
    Program() {
      names = new Set();
      namespaces = new Set();
      depth = 0;
    },
    BlockStatement() {
      depth++;
    },
    'BlockStatement:exit'() {
      depth--;
    },
    ImportDeclaration(node) {
      trackImport(node);
    },
    ClassDeclaration(node) {
      if (depth === 0 && node.id?.name && isCustomElementDecorated(node, names, namespaces))
        ctx.markExportRegistered(node.id.name);
    },
    ExportDefaultDeclaration(node) {
      if (node.declaration.type === 'ClassDeclaration' && isCustomElementDecorated(node.declaration, names, namespaces))
        ctx.markExportRegistered('default');
    },
  };
}
