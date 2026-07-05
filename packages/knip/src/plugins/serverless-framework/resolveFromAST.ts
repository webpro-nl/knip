import { Visitor, type Program } from 'oxc-parser';
import type { ResolveFromAST } from '../../types/config.ts';
import { collectPropertyValues, getImportMap, getPropertyKey, getStringValues } from '../../typescript/ast-helpers.ts';
import { _parseFile, getStringValue } from '../../typescript/ast-nodes.ts';
import type { Input } from '../../util/input.ts';
import { toDependency, toProductionEntry } from '../../util/input.ts';
import { dirname, join, relative, toAbsolute } from '../../util/path.ts';
import { _resolveSync } from '../../util/resolve.ts';
import { handlerToEntry, pluginToInput } from './helpers.ts';

const serverlessFileReference = /\$\{file\(([^):]+)\)(?::[^}]*)?\}/g;

const unwrapExpression = (node: any): any => {
  if (
    node?.type === 'ParenthesizedExpression' ||
    node?.type === 'TSAsExpression' ||
    node?.type === 'TSSatisfiesExpression' ||
    node?.type === 'TSTypeAssertion'
  ) {
    return unwrapExpression(node.expression);
  }

  return node;
};

const containsIdentifier = (node: any, name: string, seen = new Set<any>()): boolean => {
  if (!node || typeof node !== 'object') return false;
  if (seen.has(node)) return false;
  if (node.type === 'Identifier' && node.name === name) return true;

  seen.add(node);

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      if (value.some(item => containsIdentifier(item, name, seen))) return true;
    } else if (containsIdentifier(value, name, seen)) {
      return true;
    }
  }

  return false;
};

const getTemplateHandler = (node: any, containingFilePath: string, options: Parameters<ResolveFromAST>[1]) => {
  if (node?.type !== 'TemplateLiteral') return;
  if (node.expressions?.length !== 1) return;
  if (!containsIdentifier(node.expressions[0], '__dirname')) return;

  const prefix = node.quasis?.[0]?.value?.cooked ?? node.quasis?.[0]?.value?.raw;
  const suffix = node.quasis?.[1]?.value?.cooked ?? node.quasis?.[1]?.value?.raw;

  if (prefix !== '' || !suffix?.startsWith('/')) return;

  const absoluteContainingFilePath = toAbsolute(containingFilePath, options.cwd);
  const configRelativeDir = relative(options.configFileDir, dirname(absoluteContainingFilePath));

  return join(configRelativeDir, suffix);
};

const getHandlerInputs = (node: any, containingFilePath: string, options: Parameters<ResolveFromAST>[1]) => {
  const handler = getStringValue(node) ?? getTemplateHandler(node, containingFilePath, options);
  return handler ? [handlerToEntry(handler)] : [];
};

const getHandlerInputsFromProgram = (
  program: Program,
  containingFilePath: string,
  options: Parameters<ResolveFromAST>[1]
) => {
  const inputs: Input[] = [];
  const visitor = new Visitor({
    Property(node) {
      if (getPropertyKey(node) === 'handler') inputs.push(...getHandlerInputs(node.value, containingFilePath, options));
    },
  });
  visitor.visit(program);
  return inputs;
};

const getHandlerInputsFromImportedFunctionConfigs = (program: Program, options: Parameters<ResolveFromAST>[1]) => {
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

    const sourceText = options.readFile(resolvedFilePath);
    if (!sourceText) return;

    const importedProgram = _parseFile(resolvedFilePath, sourceText).program;
    inputs.push(...getHandlerInputsFromProgram(importedProgram, resolvedFilePath, options));
  };

  const visitor = new Visitor({
    Property(node) {
      if (getPropertyKey(node) !== 'functions') return;
      const functions = unwrapExpression(node.value);
      if (functions?.type !== 'ObjectExpression') return;

      for (const prop of functions.properties ?? []) {
        if (prop.type !== 'Property') continue;
        if (prop.value?.type === 'Identifier') addImportedFunctionConfig(prop.value.name);
      }
    },
  });
  visitor.visit(program);

  return inputs;
};

const getServerlessFileReferenceInputs = (program: Program, configFileDir: string) => {
  const inputs: Input[] = [];
  const addFileReferences = (node: any) => {
    const value = getStringValue(node);
    if (!value) return;

    for (const match of value.matchAll(serverlessFileReference)) {
      const filePath = match[1];
      if (filePath) inputs.push(toProductionEntry(join(configFileDir, filePath)));
    }
  };

  const visitor = new Visitor({
    Property(node) {
      addFileReferences(node.value);
    },
  });
  visitor.visit(program);

  return inputs;
};

const getEsbuildInjectInputs = (program: Program, configFileDir: string) => {
  const inputs: Input[] = [];
  const visitor = new Visitor({
    Property(node) {
      if (getPropertyKey(node) !== 'inject') return;
      for (const value of getStringValues(node.value)) {
        if (value.startsWith('.')) inputs.push(toProductionEntry(join(configFileDir, value)));
      }
    },
  });
  visitor.visit(program);
  return inputs;
};

export const getInputsFromAST: ResolveFromAST = (program, options) => [
  ...getHandlerInputsFromProgram(program, options.configFilePath, options),
  ...getHandlerInputsFromImportedFunctionConfigs(program, options),
  ...Array.from(collectPropertyValues(program, 'plugins')).map(plugin => pluginToInput(plugin, options.configFileDir)),
  ...getServerlessFileReferenceInputs(program, options.configFileDir),
  ...getEsbuildInjectInputs(program, options.configFileDir),
  ...(collectPropertyValues(program, 'esbuild').size > 0 ? [toDependency('esbuild', { optional: true })] : []),
];
