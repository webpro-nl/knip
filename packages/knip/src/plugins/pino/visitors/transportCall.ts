import ts from 'typescript';
import { IMPORT_FLAGS } from '../../../constants.js';
import { findImportSpecifier } from '../../../typescript/ast-helpers.js';
import { importVisitor as visit } from '../../../typescript/visitors/index.js';
import { isInternal } from '../../../util/path.js';

// https://getpino.io/#/docs/transports

const getTargets = (obj: ts.ObjectLiteralExpression): { text: string; pos: number }[] => {
  const results: { text: string; pos: number }[] = [];
  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) continue;
    const key = prop.name.text;
    if (key === 'target' && ts.isStringLiteralLike(prop.initializer)) {
      results.push({ text: prop.initializer.text, pos: prop.initializer.pos });
    } else if ((key === 'targets' || key === 'pipeline') && ts.isArrayLiteralExpression(prop.initializer)) {
      for (const element of prop.initializer.elements) {
        if (ts.isObjectLiteralExpression(element)) results.push(...getTargets(element));
      }
    }
  }
  return results;
};

const toImportNodes = (targets: { text: string; pos: number }[]) =>
  targets.map(({ text, pos }) => ({
    specifier: text,
    identifier: undefined,
    pos,
    modifiers: isInternal(text) ? IMPORT_FLAGS.ENTRY : IMPORT_FLAGS.NONE,
    alias: undefined,
    namespace: undefined,
    symbol: undefined,
  }));



export default visit(
  sourceFile => !!findImportSpecifier(sourceFile, 'pino'),
  node => {
    if (!ts.isCallExpression(node)) return;

    const callee = node.expression;

    // Pattern: pino.transport({ target }) or transport({ target })
    const isTransport =
      (ts.isPropertyAccessExpression(callee) && callee.name.text === 'transport') ||
      (ts.isIdentifier(callee) && callee.text === 'transport');

    if (isTransport) {
      const arg = node.arguments[0];
      if (!arg || !ts.isObjectLiteralExpression(arg)) return;
      const targets = getTargets(arg);
      if (targets.length) return toImportNodes(targets);
      return;
    }

    // Pattern: pino({ transport: { target } })
    if (ts.isIdentifier(callee) && callee.text === findImportSpecifier(node.getSourceFile(), 'pino')) {
      const arg = node.arguments[0];
      if (!arg || !ts.isObjectLiteralExpression(arg)) return;
      for (const prop of arg.properties) {
        if (
          ts.isPropertyAssignment(prop) &&
          ts.isIdentifier(prop.name) &&
          prop.name.text === 'transport' &&
          ts.isObjectLiteralExpression(prop.initializer)
        ) {
          const targets = getTargets(prop.initializer);
          if (targets.length) return toImportNodes(targets);
        }
      }
    }
  }
);
