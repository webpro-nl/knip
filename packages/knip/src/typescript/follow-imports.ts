import { Visitor, type ParseResult } from 'oxc-parser';
import { isInNodeModules } from '../util/path.ts';
import { getStringValue, isStringLiteral, stripQuotes } from './visitors/helpers.ts';

const _requireSpecs: string[] = [];
const _requireVisitor = new Visitor({
  CallExpression(node) {
    if (node.callee?.type === 'Identifier' && node.callee.name === 'require') {
      const arg = node.arguments?.[0];
      if (isStringLiteral(arg)) _requireSpecs.push(getStringValue(arg)!);
    }
    if (
      node.callee?.type === 'MemberExpression' &&
      !node.callee.computed &&
      node.callee.object?.type === 'Identifier' &&
      node.callee.object.name === 'require' &&
      node.callee.property?.name === 'resolve'
    ) {
      const arg = node.arguments?.[0];
      if (isStringLiteral(arg)) _requireSpecs.push(getStringValue(arg)!);
    }
  },
  TSImportEqualsDeclaration(node) {
    if (node.moduleReference?.type === 'TSExternalModuleReference') {
      const expr = node.moduleReference.expression;
      if (isStringLiteral(expr)) _requireSpecs.push(getStringValue(expr)!);
    }
  },
});

const _jsDocImportRe = /import\(\s*['"]([^'"]+)['"]\s*\)/g;

export function extractSpecifiers(result: ParseResult, sourceText: string, filePath: string): string[] {
  const specifiers: string[] = [];
  const mod = result.module;

  for (const si of mod.staticImports) {
    specifiers.push(si.moduleRequest.value);
  }

  for (const se of mod.staticExports) {
    for (const entry of se.entries) {
      if (entry.moduleRequest) specifiers.push(entry.moduleRequest.value);
    }
  }

  for (const di of mod.dynamicImports) {
    const cleaned = stripQuotes(sourceText.slice(di.moduleRequest.start, di.moduleRequest.end));
    if (cleaned && !cleaned.includes('$') && !cleaned.includes('+')) {
      specifiers.push(cleaned);
    }
  }

  if (!isInNodeModules(filePath)) {
    _requireSpecs.length = 0;
    _requireVisitor.visit(result.program);
    for (const spec of _requireSpecs) specifiers.push(spec);
  }

  for (const comment of result.comments) {
    if (comment.type !== 'Block') continue;
    let m: RegExpExecArray | null;
    _jsDocImportRe.lastIndex = 0;
    while ((m = _jsDocImportRe.exec(comment.value)) !== null) {
      specifiers.push(m[1]);
    }
  }

  return specifiers;
}
