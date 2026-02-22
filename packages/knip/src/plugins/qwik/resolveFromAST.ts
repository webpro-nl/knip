import ts from 'typescript';
import { getPropertyValues } from '../../typescript/ast-helpers.ts';

const findCallArg = (sourceFile: ts.SourceFile, fnName: string): ts.ObjectLiteralExpression | undefined => {
  let result: ts.ObjectLiteralExpression | undefined;

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      if (ts.isIdentifier(callee) && callee.text === fnName) {
        const arg = node.arguments[0];
        if (arg && ts.isObjectLiteralExpression(arg)) result = arg;
      }
    }
    if (!result) ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return result;
};

export const getSrcDir = (sourceFile: ts.SourceFile): string => {
  const arg = findCallArg(sourceFile, 'qwikVite');
  if (arg) {
    const values = getPropertyValues(arg, 'srcDir');
    if (values.size > 0) return Array.from(values)[0];
  }
  return 'src';
};

export const getRoutesDirs = (sourceFile: ts.SourceFile, srcDir: string): string[] => {
  const arg = findCallArg(sourceFile, 'qwikCity');
  if (arg) {
    const values = getPropertyValues(arg, 'routesDir');
    if (values.size > 0) return Array.from(values);
  }
  return [`${srcDir}/routes`];
};
