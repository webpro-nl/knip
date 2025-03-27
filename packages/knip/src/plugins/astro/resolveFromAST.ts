import { query } from '@phenomnomnominal/tsquery';
import ts from 'typescript';
import { getDefaultImportName, getImportMap, getPropertyValues } from '../../typescript/ast-helpers.js';

export const getComponentPathsFromSourceFile = (sourceFile: ts.SourceFile) => {
  const componentPaths: Set<string> = new Set();
  const importMap = getImportMap(sourceFile);
  const starlightImportName = getDefaultImportName(importMap, '@astrojs/starlight');
  const componentQuery = `CallExpression:has(Identifier[name=${starlightImportName}]):first-child PropertyAssignment:has(Identifier[name=components]) ObjectLiteralExpression`;

  const componentNodes = query(sourceFile, componentQuery);
  for (const componentNode of componentNodes) {
    if (ts.isObjectLiteralExpression(componentNode)) {
      const values = getPropertyValues(componentNode, 'components');
      for (const value of values) componentPaths.add(value);
    }
  }

  return componentPaths;
};
