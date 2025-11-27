import ts from 'typescript';
import { findDescendants, getDefaultImportName, getImportMap, stripQuotes } from '../../typescript/ast-helpers.js';

/**
 * Traverses through Vite's configuration file to find Babel plugins passed to
 * @vitejs/plugin-react's configuration
 */
export const getReactBabelPlugins = (sourceFile: ts.SourceFile): string[] => {
  const babelPlugins: string[] = [];

  const importMap = getImportMap(sourceFile);
  const reactPluginNames = new Set<string>();

  // Find the default import for @vitejs/plugin-react
  for (const [importName, importPath] of importMap) {
    if (importPath.includes('@vitejs/plugin-react')) {
      reactPluginNames.add(importName);
    }
  }

  // If no React plugin import found, look for the default import name
  if (reactPluginNames.size === 0) {
    const defaultImportName = getDefaultImportName(importMap, '@vitejs/plugin-react');
    if (defaultImportName) {
      reactPluginNames.add(defaultImportName);
    } else {
      reactPluginNames.add('react');
    }
  }

  const callExpressions = findDescendants<ts.CallExpression>(sourceFile, node => ts.isCallExpression(node));

  const defineConfigCall = callExpressions.find(
    node => ts.isIdentifier(node.expression) && node.expression.text === 'defineConfig'
  );

  if (!defineConfigCall || defineConfigCall.arguments.length === 0) {
    return babelPlugins;
  }

  const configObject = defineConfigCall.arguments[0];
  if (!ts.isObjectLiteralExpression(configObject)) {
    return babelPlugins;
  }

  const pluginsProperty = configObject.properties.find(
    prop => ts.isPropertyAssignment(prop) && prop.name.getText() === 'plugins'
  );

  if (
    !pluginsProperty ||
    !ts.isPropertyAssignment(pluginsProperty) ||
    !ts.isArrayLiteralExpression(pluginsProperty.initializer)
  ) {
    return babelPlugins;
  }

  const pluginsArray = pluginsProperty.initializer;

  // Find the react plugin call using the detected import names
  for (const pluginElement of pluginsArray.elements) {
    let isReactPlugin = false;

    // Check if this is a call to any of the identified React plugin imports
    if (ts.isCallExpression(pluginElement)) {
      if (ts.isIdentifier(pluginElement.expression)) {
        isReactPlugin = reactPluginNames.has(pluginElement.expression.text);
      }

      if (isReactPlugin) {
        if (pluginElement.arguments.length === 0 || !ts.isObjectLiteralExpression(pluginElement.arguments[0])) {
          continue;
        }

        const reactConfig = pluginElement.arguments[0] as ts.ObjectLiteralExpression;

        const babelProperty = reactConfig.properties.find(
          prop => ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === 'babel'
        );

        if (
          !babelProperty ||
          !ts.isPropertyAssignment(babelProperty) ||
          !ts.isObjectLiteralExpression(babelProperty.initializer)
        ) {
          continue;
        }

        const babelObject = babelProperty.initializer;

        const babelPluginsProperty = babelObject.properties.find(
          prop => ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === 'plugins'
        );

        if (
          !babelPluginsProperty ||
          !ts.isPropertyAssignment(babelPluginsProperty) ||
          !ts.isArrayLiteralExpression(babelPluginsProperty.initializer)
        ) {
          continue;
        }

        const pluginsArray = babelPluginsProperty.initializer;

        for (const element of pluginsArray.elements) {
          if (ts.isStringLiteral(element)) {
            babelPlugins.push(stripQuotes(element.text));
          } else if (
            ts.isArrayLiteralExpression(element) &&
            element.elements.length > 0 &&
            ts.isStringLiteral(element.elements[0])
          ) {
            babelPlugins.push(stripQuotes((element.elements[0] as ts.StringLiteral).text));
          }
        }
      }
    }
  }

  return babelPlugins;
};
