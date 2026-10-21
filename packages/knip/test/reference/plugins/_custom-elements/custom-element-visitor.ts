import type { Class, ImportDeclaration } from 'oxc-parser';
import type { PluginVisitorContext, PluginVisitorObject } from '../../types/config.ts';

function isCustomElementDecorated(
  node: Class,
  names: ReadonlySet<string>,
  namespaces: ReadonlySet<string>,
  decoratorName: string
): boolean {
  const decorators = node.decorators;
  if (!decorators || decorators.length === 0) return false;
  for (const decorator of decorators) {
    const expression = decorator.expression;
    if (expression?.type === 'Identifier') {
      if (names.has(expression.name)) return true;
      continue;
    }
    if (expression?.type !== 'CallExpression') continue;
    const callee = expression.callee;
    if (callee.type === 'Identifier') {
      if (names.has(callee.name)) return true;
    } else if (
      callee.type === 'MemberExpression' &&
      !callee.computed &&
      callee.object.type === 'Identifier' &&
      callee.property.type === 'Identifier' &&
      callee.property.name === decoratorName &&
      namespaces.has(callee.object.name)
    ) {
      return true;
    }
  }
  return false;
}

function extendsBaseClass(node: Class, baseNames: ReadonlySet<string>): boolean {
  const superClass = node.superClass;
  if (!superClass) return false;
  if (superClass.type === 'Identifier') return baseNames.has(superClass.name);
  if (superClass.type === 'CallExpression') {
    for (const arg of superClass.arguments) {
      if (arg.type === 'Identifier' && baseNames.has(arg.name)) return true;
    }
  }
  return false;
}

interface CustomElementVisitorOptions {
  decoratorName?: string;
  baseClassName?: string;
}

export function createCustomElementVisitor(
  ctx: PluginVisitorContext,
  isRegistrationSpecifier: (specifier: string) => boolean,
  { decoratorName = 'customElement', baseClassName }: CustomElementVisitorOptions = {}
): PluginVisitorObject {
  const decoratorNames = new Set<string>();
  const namespaces = new Set<string>();
  const baseNames = new Set<string>();
  const definedClasses = new Set<string>();
  let depth = 0;

  const visitor: PluginVisitorObject = {
    Program() {
      decoratorNames.clear();
      namespaces.clear();
      baseNames.clear();
      definedClasses.clear();
      depth = 0;
    },
    BlockStatement() {
      depth++;
    },
    'BlockStatement:exit'() {
      depth--;
    },
    ImportDeclaration(node: ImportDeclaration) {
      if (!node.source || !isRegistrationSpecifier(node.source.value)) return;
      for (const spec of node.specifiers ?? []) {
        if (spec.type === 'ImportSpecifier' && spec.imported.type === 'Identifier') {
          if (spec.imported.name === decoratorName) decoratorNames.add(spec.local.name);
          else if (baseClassName && spec.imported.name === baseClassName) baseNames.add(spec.local.name);
        } else if (spec.type === 'ImportNamespaceSpecifier') {
          namespaces.add(spec.local.name);
        }
      }
    },
    ClassDeclaration(node) {
      if (depth !== 0 || !node.id?.name) return;
      if (isCustomElementDecorated(node, decoratorNames, namespaces, decoratorName))
        ctx.markExportRegistered(node.id.name);
      else if (baseClassName && extendsBaseClass(node, baseNames)) definedClasses.add(node.id.name);
    },
    ExportDefaultDeclaration(node) {
      if (
        node.declaration.type === 'ClassDeclaration' &&
        isCustomElementDecorated(node.declaration, decoratorNames, namespaces, decoratorName)
      )
        ctx.markExportRegistered('default');
    },
  };

  if (baseClassName) {
    visitor.CallExpression = node => {
      const callee = node.callee;
      if (
        callee.type === 'MemberExpression' &&
        !callee.computed &&
        callee.object.type === 'Identifier' &&
        callee.property.type === 'Identifier' &&
        (callee.property.name === 'define' || callee.property.name === 'defineAsync') &&
        definedClasses.has(callee.object.name)
      )
        ctx.markExportRegistered(callee.object.name);
    };
  }

  return visitor;
}
