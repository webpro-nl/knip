import { query } from '@phenomnomnominal/tsquery';
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

// Computes to CallExpression:has(Identifier[name=TanStackRouterVite],Identifier[name=TanStackRouterRspack],Identifier[name=TanStackRouterWebpack]):first-child > ObjectLiteralExpression
const AST_QUERY = `CallExpression:has(${new Array(...FUNCTIONS.values()).map(functionName => `Identifier[name=${functionName}]`).join(',')}):first-child > ObjectLiteralExpression`;

export const getCustomConfig = (sourceFile: ts.SourceFile) => {
  const config: Record<string, string> = {};

  const configNode = query(sourceFile, AST_QUERY);
  if (configNode.length > 0 && ts.isObjectLiteralExpression(configNode[0])) {
    for (const [key, value] of getPropertyValueEntries(configNode[0], CONFIG_KEYS)) config[key] = value;
  }

  return config;
};
