import type {
  BindingIdentifier,
  Expression,
  IdentifierName,
  IdentifierReference,
  Node,
  ObjectExpression,
  Program,
  TemplateLiteral,
} from 'oxc-parser';
import type { ResolveFromAST } from '../../types/config.ts';
import { getImportMap, getPropertyKey, getStringValues } from '../../typescript/ast-helpers.ts';
import { _parseFile, getStringValue } from '../../typescript/ast-nodes.ts';
import type { Input } from '../../util/input.ts';
import { toDependency, toProductionEntry } from '../../util/input.ts';
import { dirname, join, relative, toAbsolute } from '../../util/path.ts';
import { _resolveSync } from '../../util/resolve.ts';
import { handlerToEntry, pluginToInput } from './helpers.ts';

const serverlessFileReference = /\$\{file\(([^):]+)\)(?::[^}]*)?\}/g;

type Identifier = BindingIdentifier | IdentifierName | IdentifierReference;

const isIdentifier = (node: Node | null | undefined, name?: string): node is Identifier =>
  node?.type === 'Identifier' && (name === undefined || node.name === name);

const isNode = (value: unknown): value is Node =>
  value !== null &&
  typeof value === 'object' &&
  'type' in value &&
  typeof (value as { type?: unknown }).type === 'string';

const walkNode = (node: Node, visit: (node: Node) => void, seen = new Set<Node>()) => {
  if (seen.has(node)) return;
  seen.add(node);
  visit(node);

  for (const [key, value] of Object.entries(node)) {
    if (key === 'parent') continue;
    if (Array.isArray(value)) {
      for (const item of value) if (isNode(item)) walkNode(item, visit, seen);
    } else if (isNode(value)) {
      walkNode(value, visit, seen);
    }
  }
};

const unwrapExpression = (node: Expression): Expression => {
  if (
    node.type === 'ParenthesizedExpression' ||
    node.type === 'TSAsExpression' ||
    node.type === 'TSSatisfiesExpression' ||
    node.type === 'TSTypeAssertion'
  ) {
    return unwrapExpression(node.expression);
  }

  return node;
};

const containsIdentifier = (node: Node, name: string) => {
  let result = false;
  walkNode(node, node => {
    if (isIdentifier(node, name)) result = true;
  });
  return result;
};

const getTemplateHandler = (
  node: TemplateLiteral,
  containingFilePath: string,
  options: Parameters<ResolveFromAST>[1]
) => {
  if (node.expressions.length !== 1) return;
  if (!containsIdentifier(node.expressions[0], '__dirname')) return;

  const prefix = node.quasis[0]?.value.cooked ?? node.quasis[0]?.value.raw;
  const suffix = node.quasis[1]?.value.cooked ?? node.quasis[1]?.value.raw;

  if (prefix !== '' || !suffix.startsWith('/')) return;

  const absoluteContainingFilePath = toAbsolute(containingFilePath, options.cwd);
  const configRelativeDir = relative(options.configFileDir, dirname(absoluteContainingFilePath));

  return join(configRelativeDir, suffix);
};

const getHandlerInputs = (node: Expression, containingFilePath: string, options: Parameters<ResolveFromAST>[1]) => {
  const expression = unwrapExpression(node);
  const handler =
    getStringValue(expression) ??
    (expression.type === 'TemplateLiteral' ? getTemplateHandler(expression, containingFilePath, options) : undefined);
  return handler ? [handlerToEntry(handler)] : [];
};

const getObjectPropertyValue = (node: ObjectExpression, name: string) => {
  for (const prop of node.properties) {
    if (prop.type === 'Property' && getPropertyKey(prop) === name) return prop.value;
  }
};

const getTopLevelObjectDeclarations = (program: Program) => {
  const declarations = new Map<string, Expression>();

  const addDeclaration = (node: Node) => {
    if (node.type === 'FunctionDeclaration' && node.id) {
      declarations.set(node.id.name, node);
      return;
    }

    if (node.type !== 'VariableDeclaration') return;
    for (const declaration of node.declarations) {
      if (isIdentifier(declaration.id) && declaration.init) declarations.set(declaration.id.name, declaration.init);
    }
  };

  for (const statement of program.body) {
    addDeclaration(statement);
    if (statement.type === 'ExportNamedDeclaration' && statement.declaration) addDeclaration(statement.declaration);
  }

  return declarations;
};

type Declarations = ReturnType<typeof getTopLevelObjectDeclarations>;

const getReturnedObjectExpressions = (node: Expression, declarations: Declarations) => {
  const expression = unwrapExpression(node);

  if (expression.type === 'ArrowFunctionExpression') {
    if (expression.body.type !== 'BlockStatement') return getObjectExpressions(expression.body, declarations);

    return expression.body.body.flatMap(statement =>
      statement.type === 'ReturnStatement' && statement.argument
        ? getObjectExpressions(statement.argument, declarations)
        : []
    );
  }

  if (expression.type === 'FunctionDeclaration' || expression.type === 'FunctionExpression') {
    if (!expression.body) return [];

    return expression.body.body.flatMap(statement =>
      statement.type === 'ReturnStatement' && statement.argument
        ? getObjectExpressions(statement.argument, declarations)
        : []
    );
  }

  return [];
};

const getObjectExpressions = (
  node: Expression | undefined,
  declarations: Declarations,
  seen = new Set<string>()
): ObjectExpression[] => {
  if (!node) return [];

  const expression = unwrapExpression(node);

  if (expression.type === 'ObjectExpression') return [expression];
  if (expression.type === 'ConditionalExpression') {
    return [
      ...getObjectExpressions(expression.consequent, declarations, seen),
      ...getObjectExpressions(expression.alternate, declarations, seen),
    ];
  }
  if (expression.type === 'CallExpression' && isIdentifier(expression.callee)) {
    const declaration = declarations.get(expression.callee.name);
    return declaration ? getReturnedObjectExpressions(declaration, declarations) : [];
  }
  if (isIdentifier(expression)) {
    if (seen.has(expression.name)) return [];
    const declaration = declarations.get(expression.name);
    if (!declaration) return [];

    seen.add(expression.name);
    return getObjectExpressions(declaration, declarations, seen);
  }

  return getReturnedObjectExpressions(expression, declarations);
};

const getObjectExpression = (node: Expression | undefined, declarations: Declarations) =>
  getObjectExpressions(node, declarations)[0];

const walkResolvedNode = (
  node: Node,
  declarations: Declarations,
  visit: (node: Node) => void,
  seen = new Set<Node>()
) => {
  if (seen.has(node)) return;
  seen.add(node);
  visit(node);

  if (isIdentifier(node)) {
    const declaration = declarations.get(node.name);
    if (declaration) walkResolvedNode(declaration, declarations, visit, seen);
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === 'parent') continue;
    if (Array.isArray(value)) {
      for (const item of value) if (isNode(item)) walkResolvedNode(item, declarations, visit, seen);
    } else if (isNode(value)) {
      walkResolvedNode(value, declarations, visit, seen);
    }
  }
};

const getServerlessConfigObject = (program: Program, declarations: Declarations) => {
  const getConfig = (node: Expression) => getObjectExpression(node, declarations);

  for (const statement of program.body) {
    if (statement.type === 'ExportDefaultDeclaration') {
      if (statement.declaration.type === 'TSInterfaceDeclaration') continue;
      const config = getConfig(statement.declaration);
      if (config) return config;
    }

    if (statement.type !== 'ExpressionStatement') continue;
    const expression = statement.expression;
    if (expression.type !== 'AssignmentExpression') continue;
    if (!isMemberExpressionPath(expression.left, ['module', 'exports'])) continue;
    const config = getConfig(expression.right);
    if (config) return config;
  }
};

const isMemberExpressionPath = (node: Node, path: string[]): boolean => {
  const [first, ...rest] = path;
  if (!first) return false;
  if (rest.length === 0) return isIdentifier(node, first);
  if (node.type !== 'MemberExpression' || node.computed) return false;
  return isMemberExpressionPath(node.object, path.slice(0, -1)) && isIdentifier(node.property, path.at(-1));
};

const getHandlerInputsFromFunctionObject = (
  functionConfig: ObjectExpression,
  containingFilePath: string,
  options: Parameters<ResolveFromAST>[1]
) => {
  const handler = getObjectPropertyValue(functionConfig, 'handler');
  return handler ? getHandlerInputs(handler, containingFilePath, options) : [];
};

const getImportedFunctionObject = (program: Program, identifierName: string) => {
  const declarations = getTopLevelObjectDeclarations(program);
  const declaration = declarations.get(identifierName);
  return getObjectExpression(declaration, declarations);
};

const getFunctionInputsFromObject = (
  functions: ObjectExpression,
  program: Program,
  options: Parameters<ResolveFromAST>[1]
) => {
  const inputs: Input[] = [];
  const importMap = getImportMap(program);
  const visited = new Set<string>();

  const addImportedFunctionConfig = (identifierName: string) => {
    const importPath = importMap.get(identifierName);
    if (!importPath) return;

    const resolvedPath = _resolveSync(importPath, options.configFileDir);
    if (!resolvedPath) return;

    const resolvedFilePath = toAbsolute(resolvedPath, options.cwd);
    if (visited.has(resolvedFilePath)) return;

    visited.add(resolvedFilePath);
    inputs.push(toProductionEntry(relative(options.configFileDir, resolvedFilePath)));

    try {
      const sourceText = options.readFile(resolvedFilePath);
      if (!sourceText) return;

      const importedProgram = _parseFile(resolvedFilePath, sourceText).program;
      const functionConfig = getImportedFunctionObject(importedProgram, identifierName);
      if (functionConfig) inputs.push(...getHandlerInputsFromFunctionObject(functionConfig, resolvedFilePath, options));
    } catch {}
  };

  for (const prop of functions.properties) {
    if (prop.type !== 'Property') continue;
    const value = unwrapExpression(prop.value);

    if (value.type === 'Identifier') {
      addImportedFunctionConfig(value.name);
    } else if (value.type === 'ObjectExpression') {
      inputs.push(...getHandlerInputsFromFunctionObject(value, options.configFilePath, options));
    }
  }

  return inputs;
};

const getFunctionInputs = (
  config: ObjectExpression,
  program: Program,
  declarations: Declarations,
  options: Parameters<ResolveFromAST>[1]
) => {
  const functions = getObjectExpression(getObjectPropertyValue(config, 'functions'), declarations);
  return functions ? getFunctionInputsFromObject(functions, program, options) : [];
};

const getServerlessFileReferenceInputs = (
  config: ObjectExpression,
  declarations: Declarations,
  configFileDir: string
) => {
  const inputs: Input[] = [];
  const addFileReferences = (node: Node) => {
    const value = getStringValue(node);
    if (!value) return;

    for (const match of value.matchAll(serverlessFileReference)) {
      const filePath = match[1];
      if (filePath) inputs.push(toProductionEntry(join(configFileDir, filePath)));
    }
  };

  walkResolvedNode(config, declarations, addFileReferences);

  return inputs;
};

const getPluginInputs = (config: ObjectExpression, configFileDir: string) => {
  const plugins = getObjectPropertyValue(config, 'plugins');
  return plugins ? Array.from(getStringValues(plugins)).map(plugin => pluginToInput(plugin, configFileDir)) : [];
};

const getEsbuildConfigObjects = (config: ObjectExpression, declarations: Declarations) => {
  const objects: ObjectExpression[] = [];
  const customObjects = getObjectExpressions(getObjectPropertyValue(config, 'custom'), declarations);
  const buildObjects = getObjectExpressions(getObjectPropertyValue(config, 'build'), declarations);

  for (const custom of customObjects) {
    objects.push(...getObjectExpressions(getObjectPropertyValue(custom, 'esbuild'), declarations));
  }

  for (const build of buildObjects) {
    objects.push(...getObjectExpressions(getObjectPropertyValue(build, 'esbuild'), declarations));
  }

  return objects;
};

const getEsbuildInjectInputs = (config: ObjectExpression, declarations: Declarations, configFileDir: string) => {
  const inputs: Input[] = [];
  for (const esbuildConfig of getEsbuildConfigObjects(config, declarations)) {
    for (const node of esbuildConfig.properties) {
      if (node.type !== 'Property' || getPropertyKey(node) !== 'inject') continue;
      for (const value of getStringValues(node.value)) {
        if (value.startsWith('.')) inputs.push(toProductionEntry(join(configFileDir, value)));
      }
    }
  }

  return inputs;
};

export const getInputsFromAST: ResolveFromAST = (program, options) => {
  const declarations = getTopLevelObjectDeclarations(program);
  const config = getServerlessConfigObject(program, declarations);
  if (!config) return [];

  return [
    ...getFunctionInputs(config, program, declarations, options),
    ...getPluginInputs(config, options.configFileDir),
    ...getServerlessFileReferenceInputs(config, declarations, options.configFileDir),
    ...getEsbuildInjectInputs(config, declarations, options.configFileDir),
    ...(getEsbuildConfigObjects(config, declarations).length > 0 ? [toDependency('esbuild', { optional: true })] : []),
  ];
};
