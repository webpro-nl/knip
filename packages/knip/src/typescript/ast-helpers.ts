import type { ParseResult, Program } from 'oxc-parser';
import { Visitor } from 'oxc-parser';
import stripJsonComments from 'strip-json-comments';
import { extname, isInternal } from '../util/path.ts';
import { parseFile } from './visitors/helpers.ts';

const isStringLiteral = (node: any): boolean =>
  node?.type === 'StringLiteral' || (node?.type === 'Literal' && typeof node.value === 'string');

const getStringValue = (node: any): string | undefined => (isStringLiteral(node) ? node.value : undefined);

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
          isStringLiteral(decl.init.arguments?.[0]) &&
          decl.id?.type === 'Identifier'
        ) {
          importMap.set(decl.id.name, decl.init.arguments[0].value);
        }
      }
    }
  }
  return importMap;
};

export const getDefaultImportName = (importMap: Map<string, string>, specifier: string) => {
  for (const [name, path] of importMap) {
    if (path === specifier) return name;
  }
};

export const getPropertyValues = (node: any, propertyName: string) => {
  const values = new Set<string>();
  if (node?.type !== 'ObjectExpression') return values;
  for (const prop of node.properties ?? []) {
    if (prop.type !== 'Property') continue;
    const name = prop.key?.name ?? prop.key?.value;
    if (name !== propertyName) continue;
    const init = prop.value;
    if (isStringLiteral(init)) {
      values.add(init.value);
    } else if (init?.type === 'ArrayExpression') {
      for (const el of init.elements ?? []) {
        if (isStringLiteral(el)) values.add(el.value);
      }
    } else if (init?.type === 'ObjectExpression') {
      for (const p of init.properties ?? []) {
        if (p.type === 'Property' && isStringLiteral(p.value)) {
          values.add(p.value.value);
        }
      }
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

/** Find the first ObjectExpression argument of a named function call */
export const findCallArg = (program: Program, fnName: string): any | undefined => {
  let result: any;
  const visitor = new Visitor({
    CallExpression(node) {
      if (result) return;
      if (node.callee?.type === 'Identifier' && node.callee.name === fnName) {
        const arg = node.arguments?.[0];
        if (arg?.type === 'ObjectExpression') result = arg;
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
    if (prop.type === 'Property' && (prop.key?.name === name || prop.key?.value === name)) {
      return prop.value;
    }
  }
};

/** Extract string values from an array expression, including [string, ...] tuples */
export const getStringValues = (node: any): Set<string> => {
  const values = new Set<string>();
  if (node?.type !== 'ArrayExpression') return values;
  for (const el of node.elements ?? []) {
    if (isStringLiteral(el)) {
      values.add(el.value);
    } else if (el?.type === 'ArrayExpression' && isStringLiteral(el.elements?.[0])) {
      values.add(el.elements[0].value);
    }
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
    const result = parseFile(filePath, sourceText);
    const visitor = new Visitor({
      Literal(node: any) {
        if (typeof node.value === 'string') literals.add(node.value);
      },
    });
    visitor.visit(result.program);
  } catch {}
  return literals;
};
