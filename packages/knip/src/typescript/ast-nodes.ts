import {
  parseSync,
  rawTransferSupported,
  type TemplateLiteral,
  type TSEnumDeclaration,
  type TSEnumMember,
  type TSModuleDeclaration,
  visitorKeys,
} from 'oxc-parser';
import { DEFAULT_EXTENSIONS, FIX_FLAGS, SCRIPT_INTERPOLATION, SYMBOL_TYPE } from '../constants.ts';
import { extname } from '../util/path.ts';
import type { GetImportsAndExportsOptions, IgnoreExportsUsedInFile } from '../types/config.ts';
import { timerify } from '../util/Performance.ts';
import { EMPTY_TAGS } from './visitors/jsdoc.ts';
import type { Fix } from '../types/exports.ts';
import type { SymbolType } from '../types/issues.ts';
import type { ExportMember } from '../types/module-graph.ts';

const defaultParseOptions = {
  sourceType: 'unambiguous' as const,
  experimentalRawTransfer: process.env.KNIP_DISABLE_RAW_TRANSFER !== '1' && rawTransferSupported(),
};

const parseFile = (filePath: string, sourceText: string) => {
  const ext = extname(filePath);
  const parseFileName = DEFAULT_EXTENSIONS.has(ext) ? filePath : `${filePath}.ts`;
  return parseSync(parseFileName, sourceText, defaultParseOptions);
};

export const _parseFile = timerify(parseFile);

export const isAmbientDeclarationFile = (filePath: string, sourceText: string): boolean => {
  try {
    return _parseFile(filePath, sourceText).module.staticExports.length === 0;
  } catch {
    return false;
  }
};

export type ResolveModule = (specifier: string, containingFile: string) => ResolvedModule | undefined;

export interface ResolvedModule {
  resolvedFileName: string;
  isExternalLibraryImport: boolean;
  packageName?: string;
}

export const buildLineStarts = (sourceText: string): number[] => {
  const starts = [0];
  let index = sourceText.indexOf('\n');
  while (index !== -1) {
    starts.push(index + 1);
    index = sourceText.indexOf('\n', index + 1);
  }
  return starts;
};

export const getLineAndCol = (lineStarts: number[], pos: number): { line: number; col: number } => {
  let lo = 0;
  let hi = lineStarts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (lineStarts[mid] <= pos) lo = mid;
    else hi = mid - 1;
  }
  return { line: lo + 1, col: pos - lineStarts[lo] + 1 };
};

const isQuoteOrBacktick = (ch: number) => ch === 39 || ch === 34 || ch === 96;

export const stripQuotes = (name: string) => {
  const length = name.length;
  if (length >= 2 && name.charCodeAt(0) === name.charCodeAt(length - 1) && isQuoteOrBacktick(name.charCodeAt(0)))
    return name.substring(1, length - 1);
  return name;
};

export const isStringLiteral = (node: any): boolean =>
  node?.type === 'StringLiteral' ||
  (node?.type === 'Literal' && typeof node.value === 'string') ||
  (node?.type === 'TemplateLiteral' && node.quasis?.length === 1 && node.expressions?.length === 0);

export const getStringValue = (node: any): string | undefined => {
  if (node?.type === 'StringLiteral') return node.value;
  if (node?.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node?.type === 'TemplateLiteral' && node.quasis?.length === 1 && node.expressions?.length === 0)
    return node.quasis[0].value?.cooked ?? node.quasis[0].value?.raw;
  return undefined;
};

export const getScriptFromTemplate = (template: TemplateLiteral): string => {
  const { quasis } = template;
  let script = quasis[0].value.raw;
  for (let i = 1; i < quasis.length; i++) script += SCRIPT_INTERPOLATION + quasis[i].value.raw;
  return script;
};

export const getScriptFromArg = (arg: any): string | undefined =>
  isStringLiteral(arg) ? getStringValue(arg) : arg?.type === 'TemplateLiteral' ? getScriptFromTemplate(arg) : undefined;

const SAFE_SCRIPT_ARG = /^[\w@.,:/=+~-]+$/;

export const getSafeScriptFromArgs = (executable: any, argsArray: any): string | undefined => {
  if (!isStringLiteral(executable)) return undefined;
  const value = getStringValue(executable);
  if (!value || !SAFE_SCRIPT_ARG.test(value)) return undefined;
  const parts = [value];
  if (argsArray?.type === 'ArrayExpression') {
    for (const element of argsArray.elements) {
      if (element && isStringLiteral(element)) {
        const arg = getStringValue(element);
        if (arg && SAFE_SCRIPT_ARG.test(arg)) parts.push(arg);
      }
    }
  }
  return parts.join(' ');
};

export const shouldCountRefs = (ignoreExportsUsedInFile: IgnoreExportsUsedInFile, type: SymbolType) =>
  ignoreExportsUsedInFile === true ||
  (typeof ignoreExportsUsedInFile === 'object' && type !== 'unknown' && ignoreExportsUsedInFile[type]);

export function extractNamespaceMembers(
  decl: TSModuleDeclaration,
  options: GetImportsAndExportsOptions,
  lineStarts: number[],
  getJSDocTags: (start: number) => Set<string>,
  prefix?: string
): ExportMember[] {
  if (!decl.body || decl.body.type !== 'TSModuleBlock') return [];
  const members: ExportMember[] = [];

  const addMember = (name: string, pos: number, stmtStart: number, stmtEnd: number) => {
    const fullName = prefix ? `${prefix}.${name}` : name;
    const tags = getJSDocTags(stmtStart);
    const existing = members.find(m => m.identifier === fullName);
    if (existing) {
      if (tags.size) {
        if (existing.jsDocTags === EMPTY_TAGS) existing.jsDocTags = new Set(tags);
        else for (const t of tags) existing.jsDocTags.add(t);
      }
      return;
    }
    const { line, col } = getLineAndCol(lineStarts, pos);
    const fix: Fix = options.isFixExports
      ? [stmtStart, stmtEnd, FIX_FLAGS.OBJECT_BINDING | FIX_FLAGS.WITH_NEWLINE]
      : undefined;
    members.push({
      identifier: fullName,
      type: SYMBOL_TYPE.MEMBER as SymbolType,
      pos,
      line,
      col,
      fix,
      hasRefsInFile: false,
      jsDocTags: tags,
      flags: 0,
    });
  };

  for (const stmt of decl.body.body) {
    if (stmt.type !== 'ExportNamedDeclaration' || !stmt.declaration) continue;
    const d = stmt.declaration;

    if (d.type === 'VariableDeclaration') {
      for (const declarator of d.declarations) {
        if (declarator.id.type === 'Identifier') {
          addMember(declarator.id.name, declarator.id.start, stmt.start, stmt.end);
        }
      }
    } else if (d.type === 'TSModuleDeclaration' && d.kind !== 'global' && d.id.type === 'Identifier') {
      const nestedPrefix = prefix ? `${prefix}.${d.id.name}` : d.id.name;
      const nested = extractNamespaceMembers(d as TSModuleDeclaration, options, lineStarts, getJSDocTags, nestedPrefix);
      for (const m of nested) members.push(m);
    } else if (d.id && 'name' in d.id) {
      addMember(d.id.name, d.id.start, stmt.start, stmt.end);
    }
  }
  if (!prefix && members.length > 0) markNamespaceMemberRefs(decl.body.body, members);
  return members;
}

type NamespaceScope = { prefix: string; names: Set<string>; own: Set<string>; isShadow?: boolean };

const noNames = new Set<string>();

const addBindingNames = (pattern: any, names: Set<string>) => {
  if (!pattern) return;
  if (pattern.type === 'Identifier') names.add(pattern.name);
  else if (pattern.type === 'ObjectPattern')
    for (const p of pattern.properties) addBindingNames(p.value ?? p.argument, names);
  else if (pattern.type === 'ArrayPattern') for (const el of pattern.elements) addBindingNames(el, names);
  else if (pattern.type === 'AssignmentPattern') addBindingNames(pattern.left, names);
  else if (pattern.type === 'RestElement') addBindingNames(pattern.argument, names);
};

const addDeclaredNames = (statements: any[], names: Set<string>) => {
  for (const stmt of statements) {
    if (stmt.type === 'VariableDeclaration') for (const d of stmt.declarations) addBindingNames(d.id, names);
    else if (stmt.type !== 'ExpressionStatement' && stmt.id?.type === 'Identifier') names.add(stmt.id.name);
  }
};

const addVarNames = (node: any, names: Set<string>) => {
  if (!node) return;
  switch (node.type) {
    case 'VariableDeclaration':
      if (node.kind === 'var') for (const d of node.declarations) addBindingNames(d.id, names);
      return;
    case 'BlockStatement':
      for (const stmt of node.body) addVarNames(stmt, names);
      return;
    case 'IfStatement':
      addVarNames(node.consequent, names);
      addVarNames(node.alternate, names);
      return;
    case 'ForStatement':
      addVarNames(node.init, names);
      addVarNames(node.body, names);
      return;
    case 'ForInStatement':
    case 'ForOfStatement':
      addVarNames(node.left, names);
      addVarNames(node.body, names);
      return;
    case 'WhileStatement':
    case 'DoWhileStatement':
    case 'LabeledStatement':
      addVarNames(node.body, names);
      return;
    case 'TryStatement':
      addVarNames(node.block, names);
      addVarNames(node.handler?.body, names);
      addVarNames(node.finalizer, names);
      return;
    case 'SwitchStatement':
      for (const c of node.cases) for (const stmt of c.consequent) addVarNames(stmt, names);
      return;
  }
};

const getShadowedNames = (node: any): Set<string> | undefined => {
  switch (node.type) {
    case 'BlockStatement':
    case 'StaticBlock': {
      const names = new Set<string>();
      addDeclaredNames(node.body, names);
      return names;
    }
    case 'SwitchStatement': {
      const names = new Set<string>();
      for (const c of node.cases) addDeclaredNames(c.consequent, names);
      return names;
    }
    case 'ForStatement':
    case 'ForInStatement':
    case 'ForOfStatement': {
      const init = node.init ?? node.left;
      if (init?.type !== 'VariableDeclaration') return;
      const names = new Set<string>();
      addDeclaredNames([init], names);
      return names;
    }
    case 'CatchClause': {
      const names = new Set<string>();
      addBindingNames(node.param, names);
      return names;
    }
    case 'ClassExpression':
      return node.id?.type === 'Identifier' ? new Set([node.id.name]) : undefined;
  }
  const params = node.params;
  if (!params || node.type === 'TSTypeParameterDeclaration') return;
  const names = new Set<string>();
  for (const param of Array.isArray(params) ? params : (params.items ?? [])) {
    addBindingNames(param.type === 'TSParameterProperty' ? param.parameter : param, names);
  }
  if (node.type === 'FunctionExpression' && node.id?.type === 'Identifier') names.add(node.id.name);
  if (node.body?.type === 'BlockStatement') addVarNames(node.body, names);
  return names;
};

const markNamespaceMemberRefs = (body: any[], members: ExportMember[]) => {
  const byIdentifier = new Map<string, ExportMember>();
  for (const member of members) byIdentifier.set(member.identifier, member);
  const scopes: NamespaceScope[] = [];

  const addRef = (name: string, path: string[]) => {
    for (let i = scopes.length - 1; i >= 0; i--) {
      const scope = scopes[i];
      if (!scope.names.has(name)) continue;
      if (scope.isShadow) return;
      let id = scope.prefix ? `${scope.prefix}.${name}` : name;
      for (let j = 0; j <= path.length; j++) {
        if (!scope.own.has(id)) {
          const member = byIdentifier.get(id);
          if (member) member.hasRefsInFile = true;
        }
        if (j < path.length) id = `${id}.${path[j]}`;
      }
      return;
    }
  };

  const visitBinding = (node: any) => {
    if (!node) return;
    switch (node.type) {
      case 'Identifier':
        visit(node.typeAnnotation);
        return;
      case 'ObjectPattern':
        for (const p of node.properties) {
          if (p.type === 'RestElement') visitBinding(p);
          else {
            if (p.computed) visit(p.key);
            visitBinding(p.value);
          }
        }
        visit(node.typeAnnotation);
        return;
      case 'ArrayPattern':
        for (const el of node.elements) visitBinding(el);
        visit(node.typeAnnotation);
        return;
      case 'AssignmentPattern':
        visitBinding(node.left);
        visit(node.right);
        return;
      case 'RestElement':
        visitBinding(node.argument);
        visit(node.typeAnnotation);
        return;
      case 'TSParameterProperty':
        visit(node.decorators);
        visitBinding(node.parameter);
        return;
    }
    visit(node);
  };

  const visit = (node: any): void => {
    if (!node) return;
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    const type = node.type;
    if (!type) return;
    if (type === 'Identifier') {
      addRef(node.name, []);
      visit(node.typeAnnotation);
      return;
    }
    if (type === 'JSXIdentifier') {
      addRef(node.name, []);
      return;
    }
    if (type === 'JSXMemberExpression') {
      visit(node.object);
      return;
    }
    if (type === 'JSXAttribute') {
      visit(node.value);
      return;
    }
    if (type === 'TSModuleDeclaration' && node.body?.type === 'TSModuleBlock') {
      visitNamespace(node.body.body, node.id.type === 'Identifier' ? node.id.name : undefined);
      return;
    }
    if (type === 'MemberExpression' || type === 'TSQualifiedName') {
      const path: string[] = [];
      let object = node;
      while (
        (object.type === 'MemberExpression' && !object.computed && object.property.type === 'Identifier') ||
        (object.type === 'TSQualifiedName' && object.right.type === 'Identifier')
      ) {
        path.unshift(object.type === 'MemberExpression' ? object.property.name : object.right.name);
        object = object.type === 'MemberExpression' ? object.object : object.left;
      }
      if (path.length > 0) {
        if (object.type === 'Identifier') addRef(object.name, path);
        else visit(object);
        return;
      }
    }
    const keys = visitorKeys[type];
    if (!keys) return;
    const shadowed = getShadowedNames(node);
    const shadow: NamespaceScope | undefined =
      shadowed && shadowed.size > 0 ? { prefix: '', names: shadowed, own: noNames, isShadow: true } : undefined;
    if (shadow) scopes.push(shadow);
    for (const key of keys) {
      const val = node[key];
      if (!val || key === 'label') continue;
      if (key === 'key' && !node.computed) continue;
      if (key === 'id' || (key === 'name' && type === 'TSTypeParameter') || key.startsWith('param')) {
        if (Array.isArray(val)) for (const item of val) visitBinding(item);
        else visitBinding(val);
      } else visit(val);
    }
    if (shadow) scopes.pop();
  };

  const visitNamespace = (statements: any[], name?: string) => {
    const parent = scopes.at(-1);
    const prefix = !parent ? '' : parent.prefix ? `${parent.prefix}.${name}` : (name ?? '');
    const scope: NamespaceScope = { prefix, names: new Set(), own: new Set() };
    for (const stmt of statements) {
      const d = stmt.type === 'ExportNamedDeclaration' ? stmt.declaration : stmt;
      if (d?.type === 'VariableDeclaration') for (const v of d.declarations) addBindingNames(v.id, scope.names);
      else if (d?.id?.type === 'Identifier') scope.names.add(d.id.name);
    }
    scopes.push(scope);
    for (const stmt of statements) {
      const d = stmt.type === 'ExportNamedDeclaration' && stmt.declaration ? stmt.declaration : stmt;
      if (d.type === 'VariableDeclaration') {
        for (const declarator of d.declarations) {
          const names = new Set<string>();
          addBindingNames(declarator.id, names);
          scope.own = new Set();
          for (const n of names) scope.own.add(prefix ? `${prefix}.${n}` : n);
          visitBinding(declarator.id);
          visit(declarator.init);
        }
      } else {
        scope.own = new Set();
        if (d.id?.type === 'Identifier') scope.own.add(prefix ? `${prefix}.${d.id.name}` : d.id.name);
        visit(d);
      }
    }
    scopes.pop();
  };

  visitNamespace(body);
};

export const collectAugmentationRefs = (node: TSModuleDeclaration): string[] => {
  if (!node.body || node.body.type !== 'TSModuleBlock') return [];
  const body = node.body.body;

  const declared = new Set<string>();
  for (const stmt of body) {
    const decl = stmt.type === 'ExportNamedDeclaration' && stmt.declaration ? stmt.declaration : stmt;
    if ('id' in decl && decl.id?.type === 'Identifier') declared.add(decl.id.name);
    else if (decl.type === 'VariableDeclaration')
      for (const d of decl.declarations) if (d.id.type === 'Identifier') declared.add(d.id.name);
  }

  const refs: string[] = [];
  const seen = new Set<string>();
  const add = (ref: any) => {
    if (ref?.type === 'Identifier' && !declared.has(ref.name) && !seen.has(ref.name)) {
      seen.add(ref.name);
      refs.push(ref.name);
    }
  };
  const visit = (n: any) => {
    const type = n?.type;
    if (!type) return;
    if (type === 'TSTypeReference') add(n.typeName);
    else if (type === 'TSInterfaceHeritage') add(n.expression);
    const keys = visitorKeys[type];
    if (!keys) return;
    for (const key of keys) {
      const val = n[key];
      if (!val) continue;
      if (Array.isArray(val)) {
        for (const item of val) if (item) visit(item);
      } else visit(val);
    }
  };
  for (const stmt of body) visit(stmt);

  return refs;
};

export function extractEnumMembers(
  decl: TSEnumDeclaration,
  options: GetImportsAndExportsOptions,
  lineStarts: number[],
  getJSDocTags: (start: number) => Set<string>
): ExportMember[] {
  if (!decl.body?.members) return [];
  return decl.body.members.map((member: TSEnumMember) => {
    const name =
      member.id.type === 'Identifier'
        ? member.id.name
        : member.id.type === 'Literal'
          ? member.id.raw
            ? stripQuotes(member.id.raw)
            : member.id.value
          : '';
    const pos = member.id.start;
    const { line, col } = getLineAndCol(lineStarts, pos);
    const fix: Fix = options.isFixExports
      ? [member.start, member.end, FIX_FLAGS.OBJECT_BINDING | FIX_FLAGS.WITH_NEWLINE]
      : undefined;
    const jsDocTags = getJSDocTags(member.start);
    return {
      identifier: name,
      type: SYMBOL_TYPE.MEMBER as SymbolType,
      pos,
      line,
      col,
      fix,
      hasRefsInFile: name === '',
      jsDocTags,
      flags: 0,
    };
  });
}
