import ts from 'typescript';

export function isGetOrSetAccessorDeclaration(node: ts.Node): node is ts.AccessorDeclaration {
  return node.kind === ts.SyntaxKind.SetAccessor || node.kind === ts.SyntaxKind.GetAccessor;
}

export function isPrivateMember(
  node: ts.MethodDeclaration | ts.PropertyDeclaration | ts.SetAccessorDeclaration | ts.GetAccessorDeclaration
): boolean {
  return node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.PrivateKeyword) ?? false;
}

export function isDefaultImport(
  node: ts.ImportDeclaration | ts.ImportEqualsDeclaration | ts.ExportDeclaration
): boolean {
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

export const isDeclarationFileExtension = (extension: string) =>
  extension === '.d.ts' || extension === '.d.mts' || extension === '.d.cts';

export const getJSDocTags = (node: ts.Node) => {
  const tags = new Array<string>();
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
    if (match) tags.push(match[0]);
  }
  return tags;
};

export const getLineAndCharacterOfPosition = (node: ts.Node, pos: number) => {
  const { line, character } = node.getSourceFile().getLineAndCharacterOfPosition(pos);
  return { line: line + 1, col: character + 1, pos };
};

export const getMemberStringLiterals = (typeChecker: ts.TypeChecker, node: ts.Node) => {
  if (ts.isElementAccessExpression(node)) {
    if (ts.isStringLiteral(node.argumentExpression)) return [node.argumentExpression.text];
    const type = typeChecker.getTypeAtLocation(node.argumentExpression);
    if (type.isUnion()) return type.types.map(type => (type as ts.LiteralType).value as string);
  }

  if (ts.isPropertyAccessExpression(node)) {
    return [node.name.escapedText as string];
  }
};
