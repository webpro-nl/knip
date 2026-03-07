import type ts from 'typescript';
import exportAssignment from './exportAssignment.ts';
import exportDeclaration from './exportDeclaration.ts';
import exportKeyword from './exportKeyword.ts';
import exportsAccessExpression from './exportsAccessExpression.ts';
import moduleExportsAccessExpression from './moduleExportsAccessExpression.ts';

const visitors = [
  exportAssignment,
  exportDeclaration,
  exportKeyword,
  exportsAccessExpression,
  moduleExportsAccessExpression,
];

export default (sourceFile: ts.SourceFile) => visitors.map(v => v(sourceFile));
