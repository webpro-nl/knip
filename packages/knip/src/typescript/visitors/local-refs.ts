import { Visitor, type Program, type TSTypeName } from 'oxc-parser';
import type { Export } from '../../types/module-graph.ts';

let refs: Set<string>;
let importNames: Map<string, unknown>;
let exportsMap: Map<string, Export>;

const add = (name: string) => {
  if (!importNames.has(name)) refs.add(name);
};

const visitor = new Visitor({
  ClassDeclaration(node) {
    if (node.superClass?.type === 'Identifier') add(node.superClass.name);
    for (const impl of node.implements ?? []) {
      if (impl.expression?.type === 'Identifier') add(impl.expression.name);
    }
  },
  TSInterfaceDeclaration(node) {
    for (const ext of node.extends ?? []) {
      if (ext.expression?.type === 'Identifier') add(ext.expression.name);
    }
  },
  Property(node) {
    if (node.value?.type === 'Identifier') add(node.value.name);
  },
  ReturnStatement(node) {
    if (node.argument?.type === 'Identifier') add(node.argument.name);
  },
  AssignmentExpression(node) {
    if (node.right?.type === 'Identifier') add(node.right.name);
  },
  SpreadElement(node) {
    if (node.argument?.type === 'Identifier') add(node.argument.name);
  },
  ConditionalExpression(node) {
    if (node.test?.type === 'Identifier') add(node.test.name);
    if (node.consequent?.type === 'Identifier') add(node.consequent.name);
    if (node.alternate?.type === 'Identifier') add(node.alternate.name);
  },
  ArrayExpression(node) {
    for (const el of node.elements ?? []) {
      if (el?.type === 'Identifier') add(el.name);
    }
  },
  TemplateLiteral(node) {
    for (const expr of node.expressions ?? []) {
      if (expr.type === 'Identifier') add(expr.name);
    }
  },
  BinaryExpression(node) {
    if (node.left?.type === 'Identifier') add(node.left.name);
    if (node.right?.type === 'Identifier') add(node.right.name);
  },
  LogicalExpression(node) {
    if (node.left?.type === 'Identifier') add(node.left.name);
    if (node.right?.type === 'Identifier') add(node.right.name);
  },
  UnaryExpression(node) {
    if (node.argument?.type === 'Identifier') add(node.argument.name);
  },
  SwitchStatement(node) {
    if (node.discriminant?.type === 'Identifier') add(node.discriminant.name);
    for (const c of node.cases ?? []) {
      if (c.test?.type === 'Identifier') add(c.test.name);
    }
  },
  IfStatement(node) {
    if (node.test?.type === 'Identifier') add(node.test.name);
  },
  ThrowStatement(node) {
    if (node.argument?.type === 'Identifier') add(node.argument.name);
  },
  WhileStatement(node) {
    if (node.test?.type === 'Identifier') add(node.test.name);
  },
  DoWhileStatement(node) {
    if (node.test?.type === 'Identifier') add(node.test.name);
  },
  YieldExpression(node) {
    if (node.argument?.type === 'Identifier') add(node.argument.name);
  },
  AwaitExpression(node) {
    if (node.argument?.type === 'Identifier') add(node.argument.name);
  },
  ArrowFunctionExpression(node) {
    if (node.body?.type === 'Identifier') add(node.body.name);
  },
  AssignmentPattern(node) {
    if (node.right?.type === 'Identifier') add(node.right.name);
  },
  SequenceExpression(node) {
    for (const expr of node.expressions ?? []) {
      if (expr.type === 'Identifier') add(expr.name);
    }
  },
  TSAsExpression(node) {
    if (node.expression?.type === 'Identifier') add(node.expression.name);
  },
  TSSatisfiesExpression(node) {
    if (node.expression?.type === 'Identifier') add(node.expression.name);
  },
  TSNonNullExpression(node) {
    if (node.expression?.type === 'Identifier') add(node.expression.name);
  },
  TSTypeAssertion(node) {
    if (node.expression?.type === 'Identifier') add(node.expression.name);
  },
  ParenthesizedExpression(node) {
    if (node.expression?.type === 'Identifier') add(node.expression.name);
  },
  PropertyDefinition(node) {
    if (node.value?.type === 'Identifier') add(node.value.name);
  },
  ForInStatement(node) {
    if (node.right?.type === 'Identifier') add(node.right.name);
  },
  ForOfStatement(node) {
    if (node.right?.type === 'Identifier') add(node.right.name);
  },
  JSXOpeningElement(node) {
    if (node.name?.type === 'JSXIdentifier') add(node.name.name);
    for (const attr of node.attributes ?? []) {
      if (attr.type === 'JSXSpreadAttribute' && attr.argument?.type === 'Identifier') add(attr.argument.name);
    }
  },
  JSXExpressionContainer(node) {
    if (node.expression?.type === 'Identifier') add(node.expression.name);
  },
  VariableDeclarator(node) {
    if (node.init?.type === 'Identifier') add(node.init.name);
  },
  ExpressionStatement(node) {
    if (node.expression?.type === 'Identifier') add(node.expression.name);
  },
  CallExpression(node) {
    if (node.callee?.type === 'Identifier') add(node.callee.name);
    for (const arg of node.arguments ?? []) {
      if (arg.type === 'Identifier') add(arg.name);
    }
  },
  NewExpression(node) {
    if (node.callee?.type === 'Identifier') add(node.callee.name);
    for (const arg of node.arguments ?? []) {
      if (arg.type === 'Identifier') add(arg.name);
    }
  },
  MemberExpression(node) {
    if (node.object?.type === 'Identifier') add(node.object.name);
  },
  TaggedTemplateExpression(node) {
    if (node.tag?.type === 'Identifier') add(node.tag.name);
  },
  TSQualifiedName(node) {
    let left: TSTypeName = node;
    const parts: string[] = [];
    while (left.type === 'TSQualifiedName') {
      if (left.right.type === 'Identifier') parts.unshift(left.right.name);
      left = left.left;
    }
    if (left.type === 'Identifier') {
      const rootName = left.name;
      if (!importNames.has(rootName) && parts.length > 0) {
        const exp = exportsMap.get(rootName);
        if (exp) {
          refs.add(rootName);
          for (const member of exp.members) {
            if (member.identifier === parts[0]) member.hasRefsInFile = true;
          }
        }
      }
    }
  },
  TSTypeReference(node) {
    if (node.typeName?.type === 'Identifier') {
      const name = node.typeName.name;
      if (!importNames.has(name)) refs.add(name);
    }
  },
  TSTypeQuery(node) {
    if (node.exprName?.type === 'Identifier') {
      const name = node.exprName.name;
      if (!importNames.has(name)) refs.add(name);
    }
  },
});

export function collectLocalRefs(
  program: Program,
  localImportMap: Map<string, { importedName: string; filePath: string; isNamespace: boolean }>,
  fileExports: Map<string, Export>
): Set<string> {
  refs = new Set();
  importNames = localImportMap;
  exportsMap = fileExports;
  visitor.visit(program);
  return refs;
}
