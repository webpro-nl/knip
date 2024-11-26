import { readFileSync } from 'node:fs';
import {
  type Expression,
  type Node,
  ScriptTarget,
  type SourceFile,
  SyntaxKind,
  createSourceFile,
  forEachChild,
  isArrayLiteralExpression,
  isCallExpression,
  isIdentifier,
  isImportDeclaration,
  isNamedImports,
  isNoSubstitutionTemplateLiteral,
  isNumericLiteral,
  isObjectLiteralExpression,
  isPropertyAssignment,
  isRegularExpressionLiteral,
  isStringLiteral,
} from 'typescript';
import { type TanstackRouterPluginConfig, tanstackRouterPluginConfigSchema } from './types.js';

// keys that we need to extract from the config
const CONFIG_KEYS = [
  'routeFilePrefix',
  'routeFileIgnorePrefix',
  'routeFileIgnorePattern',
  'routesDirectory',
  'generatedRouteTree',
];

function parseValue(node: Expression, sourceFile: SourceFile): any {
  if (isStringLiteral(node) || isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }

  if (isNumericLiteral(node)) {
    return Number(node.text);
  }

  if (node.kind === SyntaxKind.TrueKeyword) {
    return true;
  }

  if (node.kind === SyntaxKind.FalseKeyword) {
    return false;
  }

  if (isRegularExpressionLiteral(node)) {
    const regexText = node.getText(sourceFile);
    const match = regexText.match(/^\/(.*)\/([gimsuy]*)$/);
    if (match) {
      return new RegExp(match[1], match[2]);
    }
  }

  if (isObjectLiteralExpression(node)) {
    const result: Record<string, any> = {};
    for (const prop of node.properties) {
      if (isPropertyAssignment(prop) && isIdentifier(prop.name)) {
        result[prop.name.text] = parseValue(prop.initializer, sourceFile);
      }
    }
    return result;
  }

  if (isArrayLiteralExpression(node)) {
    return node.elements.map(element => parseValue(element, sourceFile));
  }

  return node.getText(sourceFile);
}

export function getPluginConfigFromBundlerConfig(
  filePath: string,
  fileName: string,
  moduleSpecifier: string,
  namedBinding: string
): TanstackRouterPluginConfig {
  let tanstackRouterImportName: string | undefined;

  const sourceText = readFileSync(filePath, 'utf-8');
  const sourceFile = createSourceFile(fileName, sourceText, ScriptTarget.Latest, true);

  // find the name that was used for the import
  forEachChild(sourceFile, node => {
    if (!isImportDeclaration(node)) return;
    if (!node.moduleSpecifier.getText(sourceFile).includes(moduleSpecifier)) return;
    if (!node.importClause) return;

    if (node.importClause.namedBindings && isNamedImports(node.importClause.namedBindings)) {
      for (const element of node.importClause.namedBindings.elements) {
        if (
          element.name.getText(sourceFile) === namedBinding ||
          (element.propertyName && element.propertyName.text === namedBinding)
        ) {
          tanstackRouterImportName = element.name.text;
        }
      }
    }

    if (node.importClause.name) {
      tanstackRouterImportName = node.importClause.name.text;
    }
  });

  const tanstackRouterConfig: Record<string, string> = {};

  if (tanstackRouterImportName) {
    const findCallExpressions = (node: Node) => {
      if (
        isCallExpression(node) &&
        isIdentifier(node.expression) &&
        node.expression.text === tanstackRouterImportName
      ) {
        const args = node.arguments.at(0);

        // for now, this only supports object literals as arguments to the plugin
        // not variables or something like a function call that returns an object

        if (args && isObjectLiteralExpression(args)) {
          for (const prop of args.properties) {
            if (isPropertyAssignment(prop) && isIdentifier(prop.name) && CONFIG_KEYS.includes(prop.name.text)) {
              const key = prop.name.text;
              const value = parseValue(prop.initializer, sourceFile);
              tanstackRouterConfig[key] = value;
            }
          }
        }
      }

      forEachChild(node, findCallExpressions);
    };

    forEachChild(sourceFile, findCallExpressions);
  }

  return tanstackRouterPluginConfigSchema.parse(tanstackRouterConfig);
}

export function getVitePluginConfig(filePath: string, fileName: string): TanstackRouterPluginConfig {
  return getPluginConfigFromBundlerConfig(filePath, fileName, '@tanstack/router-plugin/vite', 'TanStackRouterVite');
}

export function getRspackPluginConfig(filePath: string, fileName: string): TanstackRouterPluginConfig {
  return getPluginConfigFromBundlerConfig(filePath, fileName, '@tanstack/router-plugin/rspack', 'TanStackRouterRspack');
}

export function getRsbuildPluginConfig(filePath: string, fileName: string): TanstackRouterPluginConfig {
  return getPluginConfigFromBundlerConfig(filePath, fileName, '@tanstack/router-plugin/rspack', 'TanStackRouterRspack');
}

export function getWebpackPluginConfig(filePath: string, fileName: string): TanstackRouterPluginConfig {
  return getPluginConfigFromBundlerConfig(
    filePath,
    fileName,
    '@tanstack/router-plugin/webpack',
    'TanStackRouterWebpack'
  );
}
