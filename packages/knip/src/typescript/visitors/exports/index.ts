import type ts from 'typescript';
import exportAssignment from './exportAssignment.js';
import exportDeclaration from './exportDeclaration.js';
import exportKeyword from './exportKeyword.js';
import exportsAccessExpression from './exportsAccessExpression.js';
import moduleExportsAccessExpression from './moduleExportsAccessExpression.js';

const visitors = [
  exportAssignment,
  exportDeclaration,
  exportKeyword,
  exportsAccessExpression,
  moduleExportsAccessExpression,
];

export default (sourceFile: ts.SourceFile) => visitors.map(v => v(sourceFile));
