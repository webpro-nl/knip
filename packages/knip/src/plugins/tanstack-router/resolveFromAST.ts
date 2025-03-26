import ts from 'typescript';
import { getPropertyValueEntries } from '../../typescript/ast-helpers.js';

const CONFIG_KEYS = new Set([
  'routeFilePrefix',
  'routeFileIgnorePrefix',
  'routeFileIgnorePattern',
  'routesDirectory',
  'generatedRouteTree',
]);

const FUNCTIONS = new Set(['TanStackRouterVite', 'TanStackRouterRspack', 'TanStackRouterWebpack']);

export const getCustomConfig = (sourceFile: ts.SourceFile) => {
  const config: Record<string, string> = {};

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      if (ts.isIdentifier(callee) && FUNCTIONS.has(callee.text)) {
        const firstArg = node.arguments[0];
        if (ts.isObjectLiteralExpression(firstArg)) {
          for (const [key, value] of getPropertyValueEntries(firstArg, CONFIG_KEYS)) config[key] = value;
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return config;
};
