import type { CallExpression, ParseResult, Program } from 'oxc-parser';
import { Visitor } from 'oxc-parser';
import stripJsonComments from 'strip-json-comments';
import { extname, isInternal } from '../util/path.ts';
import { _parseFile, getStringValue } from './ast-nodes.ts';

export const getPropertyKey = (prop: any): string | undefined =>
  prop?.key?.type === 'Identifier' ? prop.key.name : getStringValue(prop?.key);

export const getImportMap = (program: Program) => {
  const importMap = new Map<string, string>();
  for (const node of (program as any).body ?? []) {
    if (node.type === 'ImportDeclaration') {
      const importPath = getStringValue(node.source);
      if (!importPath) continue;
      for (const spec of node.specifiers ?? []) {
        if (spec.type === 'ImportDefaultSpecifier' && spec.local?.name) {
          importMap.set(spec.local.name, importPath);
        } else if (spec.type === 'ImportSpecifier' && spec.local?.name) {
          importMap.set(spec.local.name, importPath);
        }
      }
    }
    if (node.type === 'VariableDeclaration') {
      for (const decl of node.declarations ?? []) {
        if (
          decl.init?.type === 'CallExpression' &&
          decl.init.callee?.type === 'Identifier' &&
          decl.init.callee.name === 'require' &&
          decl.id?.type === 'Identifier'
        ) {
          const source = getStringValue(decl.init.arguments?.[0]);
          if (source != null) importMap.set(decl.id.name, source);
        }
      }
    }
  }
  return importMap;
};

const addStringValue = (values: Set<string>, node: any) => {
  const value = getStringValue(node);
  if (value != null) values.add(value);
};

export const getPropertyValues = (node: any, propertyName: string) => {
  const values = new Set<string>();
  if (node?.type !== 'ObjectExpression') return values;
  for (const prop of node.properties ?? []) {
    if (prop.type !== 'Property') continue;
    if (getPropertyKey(prop) !== propertyName) continue;
    const init = prop.value;
    if (init?.type === 'ArrayExpression') {
      for (const el of init.elements ?? []) addStringValue(values, el);
    } else if (init?.type === 'ObjectExpression') {
      for (const p of init.properties ?? []) {
        if (p.type === 'Property') addStringValue(values, p.value);
      }
    } else {
      addStringValue(values, init);
    }
  }
  return values;
};

/** Collect all values of a named property from any ObjectExpression in the program */
export const collectPropertyValues = (program: Program, propertyName: string): Set<string> => {
  const values = new Set<string>();
  const visitor = new Visitor({
    ObjectExpression(node) {
      for (const v of getPropertyValues(node, propertyName)) values.add(v);
    },
  });
  visitor.visit(program);
  return values;
};

const firstValue = (values: Iterable<string>): string | undefined => {
  for (const value of values) return value;
};

/** First value of a named property in an ObjectExpression */
export const getFirstPropertyValue = (node: any, propertyName: string) =>
  firstValue(getPropertyValues(node, propertyName));

/** First value of a named property from any ObjectExpression in the program */
export const collectFirstPropertyValue = (program: Program, propertyName: string) =>
  firstValue(collectPropertyValues(program, propertyName));

const unwrapParens = (node: any): any =>
  node?.type === 'ParenthesizedExpression' ? unwrapParens(node.expression) : node;

/**
 * Resolve a `defineConfig`-style argument to its ObjectExpression. Handles:
 * object form `defineConfig({...})`, implicit-return arrow `defineConfig(() => ({...}))`,
 * and `defineConfig(() => { return {...}; })` (single inline return). Unwraps
 * `ParenthesizedExpression` at every step.
 */
export const resolveObjectArg = (arg: any): any | undefined => {
  const node = unwrapParens(arg);
  if (!node) return;
  if (node.type === 'ObjectExpression') return node;
  if (node.type !== 'ArrowFunctionExpression' && node.type !== 'FunctionExpression') return;
  const body = unwrapParens(node.body);
  if (body?.type === 'ObjectExpression') return body;
  if (body?.type !== 'BlockStatement') return;
  for (const stmt of body.body ?? []) {
    if (stmt.type === 'ReturnStatement') {
      const ret = unwrapParens(stmt.argument);
      if (ret?.type === 'ObjectExpression') return ret;
    }
  }
};

type ModuleMatch = string | string[] | ((path: string) => boolean);

/** Find all CallExpressions whose callee is a binding imported from the given module(s) */
export const findImportedCalls = (program: Program, module: ModuleMatch): CallExpression[] => {
  const isMatch =
    typeof module === 'function'
      ? module
      : Array.isArray(module)
        ? (path: string) => module.includes(path)
        : (path: string) => path === module;
  const names = new Set<string>();
  for (const [name, path] of getImportMap(program)) if (isMatch(path)) names.add(name);
  const calls: CallExpression[] = [];
  if (names.size === 0) return calls;
  const visitor = new Visitor({
    CallExpression(node) {
      if (node.callee?.type === 'Identifier' && names.has(node.callee.name)) calls.push(node);
    },
  });
  visitor.visit(program);
  return calls;
};

/** Find the first ObjectExpression argument of a call to a binding imported from the given module(s) */
export const findImportedCallArg = (program: Program, module: ModuleMatch): any | undefined => {
  for (const call of findImportedCalls(program, module)) {
    const arg = resolveObjectArg(call.arguments?.[0]);
    if (arg) return arg;
  }
};

/** Find the first ObjectExpression argument of a named function call */
export const findCallArg = (program: Program, fnName: string): any | undefined => {
  let result: any;
  const visitor = new Visitor({
    CallExpression(node) {
      if (result) return;
      if (node.callee?.type === 'Identifier' && node.callee.name === fnName) {
        const obj = resolveObjectArg(node.arguments?.[0]);
        if (obj) result = obj;
      }
    },
  });
  visitor.visit(program);
  return result;
};

/** Find a named property in an ObjectExpression, returns the value node */
export const findProperty = (node: any, name: string): any | undefined => {
  if (node?.type !== 'ObjectExpression') return;
  for (const prop of node.properties ?? []) {
    if (prop.type === 'Property' && getPropertyKey(prop) === name) return prop.value;
  }
};

/** Extract string values from an array expression, including [string, ...] tuples */
export const getStringValues = (node: any): Set<string> => {
  const values = new Set<string>();
  if (node?.type !== 'ArrayExpression') return values;
  for (const el of node.elements ?? []) {
    if (el?.type === 'ArrayExpression') addStringValue(values, el.elements?.[0]);
    else addStringValue(values, el);
  }
  return values;
};

export const isExternalReExportsOnly = (result: ParseResult): boolean => {
  const mod = result.module;
  if (mod.staticExports.length === 0) return false;
  for (const se of mod.staticExports) {
    for (const entry of se.entries) {
      if (!entry.moduleRequest) return false;
      if (isInternal(entry.moduleRequest.value)) return false;
    }
  }
  if (mod.staticImports.length > 0) return false;
  return true;
};

/** Check if a specific named import exists from a module */
export const hasImportSpecifier = (program: Program, modulePath: string, specifierName: string): boolean => {
  for (const node of (program as any).body ?? []) {
    if (node.type !== 'ImportDeclaration' || getStringValue(node.source) !== modulePath) continue;
    for (const spec of node.specifiers ?? []) {
      if (spec.type === 'ImportSpecifier') {
        const imported = spec.imported?.name ?? spec.local?.name;
        if (imported === specifierName) return true;
      }
    }
  }
  return false;
};

const collectJsonStringLiterals = (obj: unknown, literals: Set<string>) => {
  if (typeof obj === 'string') {
    literals.add(obj);
  } else if (Array.isArray(obj)) {
    for (const item of obj) collectJsonStringLiterals(item, literals);
  } else if (obj && typeof obj === 'object') {
    for (const val of Object.values(obj)) collectJsonStringLiterals(val, literals);
  }
};

export const collectStringLiterals = (sourceText: string, filePath: string): Set<string> => {
  const literals = new Set<string>();
  try {
    const ext = extname(filePath);
    if (ext === '.json' || ext === '.jsonc' || ext === '.json5') {
      collectJsonStringLiterals(JSON.parse(stripJsonComments(sourceText, { trailingCommas: true })), literals);
      return literals;
    }
    const result = _parseFile(filePath, sourceText);
    const visitor = new Visitor({
      Literal(node: any) {
        if (typeof node.value === 'string') literals.add(node.value);
      },
    });
    visitor.visit(result.program);
  } catch {}
  return literals;
};
