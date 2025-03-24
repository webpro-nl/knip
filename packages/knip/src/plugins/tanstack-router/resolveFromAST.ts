import ts from 'typescript';

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
          for (const prop of firstArg.properties) {
            if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
              if (CONFIG_KEYS.has(prop.name.text)) {
                if (ts.isStringLiteral(prop.initializer)) {
                  config[prop.name.text] = prop.initializer.text;
                }
              }
            }
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return config;
};
