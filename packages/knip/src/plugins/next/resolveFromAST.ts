import { match } from '@phenomnomnominal/tsquery';
import ts from 'typescript';

import { getPropertyValues } from '../../typescript/ast-helpers.js';

export const getPageExtensions = (sourceFile: ts.SourceFile) => {
  const pageExtensions: Set<string> = new Set();

  const objectLiteralExpressions = match(sourceFile, 'ObjectLiteralExpression');
  for (const objectLiteralExpression of objectLiteralExpressions) {
    if (!ts.isObjectLiteralExpression(objectLiteralExpression)) {
      continue;
    }
    const values = getPropertyValues(objectLiteralExpression, 'pageExtensions');
    for (const value of values) pageExtensions.add(value);
  }

  return Array.from(pageExtensions);
};
