import ts from 'typescript';
import { getDefaultImportName, getImportMap, getPropertyValues, stripQuotes } from '../../typescript/ast-helpers.js';

export const getPageExtensions = (sourceFile: ts.SourceFile) => {
  const pageExtensions: Set<string> = new Set();

  function visit(node: ts.Node) {
    if (ts.isObjectLiteralExpression(node)) {
      const values = getPropertyValues(node, 'pageExtensions');
      for (const value of values) pageExtensions.add(value);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return Array.from(pageExtensions);
};

const isNamedProp = (prop: ts.ObjectLiteralElementLike, name: string) =>
  ts.isPropertyAssignment(prop) && prop.name.getText() === name;

export const getMdxPlugins = (sourceFile: ts.SourceFile) => {
  const plugins = new Set<string>();
  const importMap = getImportMap(sourceFile);
  const mdxImportName = getDefaultImportName(importMap, '@next/mdx');

  if (!mdxImportName) return plugins;

  function visit(node: ts.Node): boolean {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === mdxImportName) {
      if (node.arguments.length > 0 && ts.isObjectLiteralExpression(node.arguments[0])) {
        const options = node.arguments[0]?.properties.find(prop => isNamedProp(prop, 'options'));
        if (options && ts.isPropertyAssignment(options)) {
          if (ts.isObjectLiteralExpression(options.initializer)) {
            for (const pluginType of ['remarkPlugins', 'rehypePlugins', 'recmaPlugins']) {
              const props = options.initializer.properties.find(prop => isNamedProp(prop, pluginType));
              if (props && ts.isPropertyAssignment(props)) {
                if (ts.isArrayLiteralExpression(props.initializer)) {
                  for (const element of props.initializer.elements) {
                    if (ts.isStringLiteral(element)) {
                      plugins.add(stripQuotes(element.text));
                    } else if (ts.isArrayLiteralExpression(element) && element.elements.length > 0) {
                      const firstElement = element.elements[0];
                      if (ts.isStringLiteral(firstElement)) {
                        plugins.add(stripQuotes(firstElement.text));
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      return true;
    }

    return ts.forEachChild(node, visit) ?? false;
  }

  visit(sourceFile);

  return plugins;
};
