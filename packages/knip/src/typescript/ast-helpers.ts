import ts from 'typescript';
import { FIX_FLAGS, SYMBOL_TYPE } from '../constants.js';
import type { Fix } from '../types/exports.js';
import type { SymbolType } from '../types/issues.js';
import type { BoundSourceFile } from './SourceFile.js';

function isGetOrSetAccessorDeclaration(node: ts.Node): node is ts.AccessorDeclaration {
  return node.kind === ts.SyntaxKind.SetAccessor || node.kind === ts.SyntaxKind.GetAccessor;
}

function isPrivateMember(
  node: ts.MethodDeclaration | ts.PropertyDeclaration | ts.SetAccessorDeclaration | ts.GetAccessorDeclaration
): boolean {
  return node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.PrivateKeyword) ?? false;
}

export function isDefaultImport(
  node: ts.ImportDeclaration | ts.ImportEqualsDeclaration | ts.ExportDeclaration
): node is ts.ImportDeclaration {
  return node.kind === ts.SyntaxKind.ImportDeclaration && !!node.importClause && !!node.importClause.name;
}

export function isAccessExpression(node: ts.Node): node is ts.AccessExpression {
  return ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node);
}

export function isImportCall(node: ts.Node): node is ts.ImportCall {
  return (
    node.kind === ts.SyntaxKind.CallExpression &&
    (node as ts.CallExpression).expression.kind === ts.SyntaxKind.ImportKeyword
  );
}

export function isRequireCall(callExpression: ts.Node): callExpression is ts.CallExpression {
  if (callExpression.kind !== ts.SyntaxKind.CallExpression) {
    return false;
  }
  const { expression, arguments: args } = callExpression as ts.CallExpression;

  if (expression.kind !== ts.SyntaxKind.Identifier || (expression as ts.Identifier).escapedText !== 'require') {
    return false;
  }

  return args.length === 1;
}

export function isPropertyAccessCall(node: ts.Node, identifier: string): node is ts.CallExpression {
  return (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.getText() === identifier
  );
}

export const getNodeType = (node: ts.Node): SymbolType => {
  if (!node) return SYMBOL_TYPE.UNKNOWN;
  if (ts.isFunctionDeclaration(node)) return SYMBOL_TYPE.FUNCTION;
  if (ts.isClassDeclaration(node)) return SYMBOL_TYPE.CLASS;
  if (ts.isInterfaceDeclaration(node)) return SYMBOL_TYPE.INTERFACE;
  if (ts.isTypeAliasDeclaration(node)) return SYMBOL_TYPE.TYPE;
  if (ts.isEnumDeclaration(node)) return SYMBOL_TYPE.ENUM;
  if (ts.isVariableDeclaration(node)) return SYMBOL_TYPE.VARIABLE;
  return SYMBOL_TYPE.UNKNOWN;
};

export const isNonPrivatePropertyOrMethodDeclaration = (
  member: ts.ClassElement
): member is ts.MethodDeclaration | ts.PropertyDeclaration =>
  (ts.isPropertyDeclaration(member) || ts.isMethodDeclaration(member) || isGetOrSetAccessorDeclaration(member)) &&
  !isPrivateMember(member);

export const getClassMember = (member: ts.MethodDeclaration | ts.PropertyDeclaration, isFixTypes: boolean) => ({
  node: member,
  identifier: member.name.getText(),
  // Naive, but [does.the.job()]
  pos: member.name.getStart() + (ts.isComputedPropertyName(member.name) ? 1 : 0),
  type: SYMBOL_TYPE.MEMBER,
  fix: isFixTypes ? ([member.getStart(), member.getEnd(), FIX_FLAGS.NONE] as Fix) : undefined,
});

export const getEnumMember = (member: ts.EnumMember, isFixTypes: boolean) => ({
  node: member,
  identifier: stripQuotes(member.name.getText()),
  pos: member.name.getStart(),
  type: SYMBOL_TYPE.MEMBER,
  fix: isFixTypes
    ? ([member.getStart(), member.getEnd(), FIX_FLAGS.OBJECT_BINDING | FIX_FLAGS.WITH_NEWLINE] as Fix)
    : undefined,
});

export function stripQuotes(name: string) {
  const length = name.length;
  if (length >= 2 && name.charCodeAt(0) === name.charCodeAt(length - 1) && isQuoteOrBacktick(name.charCodeAt(0))) {
    return name.substring(1, length - 1);
  }
  return name;
}

enum CharacterCodes {
  backtick = 0x60,
  doubleQuote = 0x22,
  singleQuote = 0x27,
}

function isQuoteOrBacktick(charCode: number) {
  return (
    charCode === CharacterCodes.singleQuote ||
    charCode === CharacterCodes.doubleQuote ||
    charCode === CharacterCodes.backtick
  );
}

export function findAncestor<T>(
  node: ts.Node | undefined,
  callback: (element: ts.Node) => boolean | 'STOP'
): T | undefined {
  node = node?.parent;
  while (node) {
    const result = callback(node);
    if (result === 'STOP') {
      return undefined;
    }
    if (result) {
      return node as T;
    }
    node = node.parent;
  }
  return undefined;
}

export function findDescendants<T>(node: ts.Node | undefined, callback: (element: ts.Node) => boolean | 'STOP'): T[] {
  const results: T[] = [];

  if (!node) return results;

  function visit(node: ts.Node) {
    const result = callback(node);
    if (result === 'STOP') {
      return;
    }
    if (result) {
      results.push(node as T);
    }
    ts.forEachChild(node, visit);
  }

  visit(node);

  return results;
}

export const getLeadingComments = (sourceFile: BoundSourceFile) => {
  const text = sourceFile.text;
  if (!text) return [];

  const firstStatement = sourceFile.statements[0];
  const limit = firstStatement ? firstStatement.getStart() : text.length;

  const ranges = ts.getLeadingCommentRanges(text, 0);
  if (!ranges?.length) return [];

  const comments = [];
  for (const range of ranges) {
    if (range.end > limit) break;
    comments.push({ ...range, text: text.slice(range.pos, range.end) });
  }

  return comments;
};

export const isDeclarationFileExtension = (extension: string) =>
  extension === '.d.ts' || extension === '.d.mts' || extension === '.d.cts';

export const getJSDocTags = (node: ts.Node) => {
  const tags = new Set<string>();
  let tagNodes = ts.getJSDocTags(node);
  if (ts.isExportSpecifier(node) || ts.isBindingElement(node)) {
    tagNodes = [...tagNodes, ...ts.getJSDocTags(node.parent.parent)];
  } else if (ts.isEnumMember(node) || ts.isClassElement(node)) {
    tagNodes = [...tagNodes, ...ts.getJSDocTags(node.parent)];
  } else if (ts.isCallExpression(node)) {
    tagNodes = [...tagNodes, ...ts.getJSDocTags(node.parent)];
  }
  for (const tagNode of tagNodes) {
    const match = tagNode.getText()?.match(/@\S+/);
    if (match) tags.add(match[0]);
  }
  return tags;
};

export const getLineAndCharacterOfPosition = (node: ts.Node, pos: number) => {
  const { line, character } = node.getSourceFile().getLineAndCharacterOfPosition(pos);
  return { line: line + 1, col: character + 1, pos };
};

const getMemberStringLiterals = (typeChecker: ts.TypeChecker, node: ts.Node) => {
  if (ts.isElementAccessExpression(node)) {
    if (ts.isStringLiteral(node.argumentExpression)) return [node.argumentExpression.text];
    const type = typeChecker.getTypeAtLocation(node.argumentExpression);
    if (type.isUnion()) return type.types.map(type => (type as ts.LiteralType).value as string);
  }

  if (ts.isPropertyAccessExpression(node)) {
    return [node.name.getText()];
  }
};

export const getAccessMembers = (typeChecker: ts.TypeChecker, node: ts.Identifier) => {
  let members: string[] = [];
  let current: ts.Node = node.parent;
  while (current) {
    const ms = getMemberStringLiterals(typeChecker, current);
    if (!ms) break;
    const joinIds = (id: string) => (members.length === 0 ? id : members.map(ns => `${ns}.${id}`));
    members = members.concat(ms.flatMap(joinIds));
    current = current.parent;
  }
  return members;
};

export const isDestructuring = (node: ts.Node) =>
  node.parent &&
  ts.isVariableDeclaration(node.parent) &&
  ts.isVariableDeclarationList(node.parent.parent) &&
  ts.isObjectBindingPattern(node.parent.name);

export const getDestructuredNames = (name: ts.ObjectBindingPattern): [string[], boolean] => {
  const members: string[] = [];
  let hasSpread = false;
  for (const element of name.elements) {
    if (element.dotDotDotToken) {
      hasSpread = true;
      break;
    }
    members.push(element.name.getText());
  }
  return [members, hasSpread];
};

export const isConsiderReferencedNS = (node: ts.Identifier) =>
  ts.isPropertyAssignment(node.parent) ||
  ts.isShorthandPropertyAssignment(node.parent) ||
  (ts.isCallExpression(node.parent) && node.parent.arguments.includes(node)) ||
  ts.isSpreadAssignment(node.parent) ||
  ts.isArrayLiteralExpression(node.parent) ||
  ts.isExportAssignment(node.parent) ||
  (ts.isVariableDeclaration(node.parent) && node.parent.initializer === node) ||
  ts.isTypeQueryNode(node.parent.parent);

export const isInOpaqueExpression = (node: ts.Node): boolean =>
  ts.isAwaitExpression(node.parent)
    ? isInOpaqueExpression(node.parent)
    : ts.isCallExpression(node.parent) ||
      ts.isReturnStatement(node.parent) ||
      ts.isArrowFunction(node.parent) ||
      ts.isPropertyAssignment(node.parent) ||
      ts.isSpreadAssignment(node.parent.parent);

const objectEnumerationMethods = new Set(['keys', 'entries', 'values', 'getOwnPropertyNames']);
export const isObjectEnumerationCallExpressionArgument = (node: ts.Identifier) =>
  ts.isCallExpression(node.parent) &&
  node.parent.arguments.includes(node) &&
  ts.isPropertyAccessExpression(node.parent.expression) &&
  ts.isIdentifier(node.parent.expression.expression) &&
  node.parent.expression.expression.escapedText === 'Object' &&
  objectEnumerationMethods.has(String(node.parent.expression.name.escapedText));

export const isInForIteration = (node: ts.Node) =>
  node.parent && (ts.isForInStatement(node.parent) || ts.isForOfStatement(node.parent));

export const isTopLevel = (node: ts.Node) =>
  ts.isSourceFile(node.parent) || (node.parent && ts.isSourceFile(node.parent.parent));

export const getTypeRef = (node: ts.Identifier) => {
  if (!node.parent?.parent) return;
  return findAncestor<ts.TypeReferenceNode>(node, _node => ts.isTypeReferenceNode(_node));
};

export const isImportSpecifier = (node: ts.Node) =>
  ts.isImportSpecifier(node.parent) ||
  ts.isImportEqualsDeclaration(node.parent) ||
  ts.isImportClause(node.parent) ||
  ts.isNamespaceImport(node.parent);

const isInExportedNode = (node: ts.Node): boolean => {
  if (getExportKeywordNode(node)) return true;
  return node.parent ? isInExportedNode(node.parent) : false;
};

export const isReferencedInExport = (node: ts.Node) => {
  if (ts.isTypeQueryNode(node.parent) && isInExportedNode(node.parent.parent)) return true;
  if (ts.isTypeReferenceNode(node.parent) && isInExportedNode(node.parent.parent)) return true;
  return false;
};

export const getExportKeywordNode = (node: ts.Node) =>
  // @ts-expect-error Property 'modifiers' does not exist on type 'Node'.
  (node.modifiers as ts.Modifier[])?.find(mod => mod.kind === ts.SyntaxKind.ExportKeyword);

export const getDefaultKeywordNode = (node: ts.Node) =>
  // @ts-expect-error Property 'modifiers' does not exist on type 'Node'.
  (node.modifiers as ts.Modifier[])?.find(mod => mod.kind === ts.SyntaxKind.DefaultKeyword);

export const hasRequireCall = (node: ts.Node): boolean => {
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'require') return true;
  return node.getChildren().some(child => hasRequireCall(child));
};

export const isModuleExportsAccess = (node: ts.PropertyAccessExpression) =>
  ts.isIdentifier(node.expression) && node.expression.escapedText === 'module' && node.name.escapedText === 'exports';

export const getImportMap = (sourceFile: ts.SourceFile) => {
  const importMap = new Map<string, string>();
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      const importClause = statement.importClause;
      const importPath = stripQuotes(statement.moduleSpecifier.getText());
      if (importClause?.name) importMap.set(importClause.name.text, importPath);
      if (importClause?.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
        for (const element of importClause.namedBindings.elements) importMap.set(element.name.text, importPath);
      }
    }
  }
  return importMap;
};

export const getDefaultImportName = (importMap: ReturnType<typeof getImportMap>, specifier: string) => {
  for (const [importName, importSpecifier] of importMap) {
    if (importSpecifier === specifier) return importName;
  }
};

export const getPropertyValues = (node: ts.ObjectLiteralExpression, propertyName: string) => {
  const values = new Set<string>();
  if (ts.isObjectLiteralExpression(node)) {
    const props = node.properties.find(prop => ts.isPropertyAssignment(prop) && prop.name.getText() === propertyName);
    if (props && ts.isPropertyAssignment(props)) {
      const initializer = props.initializer;
      if (ts.isStringLiteral(initializer)) {
        values.add(initializer.text);
      } else if (ts.isArrayLiteralExpression(initializer)) {
        for (const element of initializer.elements) {
          if (ts.isStringLiteral(element)) values.add(element.text);
        }
      } else if (ts.isObjectLiteralExpression(initializer)) {
        for (const prop of initializer.properties) {
          if (ts.isPropertyAssignment(prop)) {
            if (ts.isStringLiteral(prop.initializer)) values.add(prop.initializer.text);
          }
        }
      }
    }
  }
  return values;
};

const isMatchAlias = (expression: ts.Expression | undefined, identifier: string) => {
  while (expression && ts.isAwaitExpression(expression)) expression = expression.expression;
  return expression && ts.isIdentifier(expression) && expression.escapedText === identifier;
};

export const getAccessedIdentifiers = (identifier: string, scope: ts.Node) => {
  const identifiers: Array<{ identifier: string; pos: number }> = [];

  function visit(node: ts.Node) {
    if (ts.isPropertyAccessExpression(node) && isMatchAlias(node.expression, identifier)) {
      identifiers.push({ identifier: String(node.name.escapedText), pos: node.name.pos });
    } else if (
      ts.isElementAccessExpression(node) &&
      isMatchAlias(node.expression, identifier) &&
      ts.isStringLiteral(node.argumentExpression)
    ) {
      identifiers.push({
        identifier: stripQuotes(node.argumentExpression.text),
        pos: node.argumentExpression.pos,
      });
    } else if (
      ts.isVariableDeclaration(node) &&
      isMatchAlias(node.initializer, identifier) &&
      ts.isObjectBindingPattern(node.name)
    ) {
      for (const element of node.name.elements) {
        if (ts.isBindingElement(element)) {
          const identifier = (element.propertyName ?? element.name).getText();
          identifiers.push({ identifier, pos: element.getStart() });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(scope);

  return identifiers;
};
