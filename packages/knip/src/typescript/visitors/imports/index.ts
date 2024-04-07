import type ts from 'typescript';
import importDeclaration from './importDeclaration.js';
import importEqualsDeclaration from './importEqualsDeclaration.js';
import reExportDeclaration from './reExportDeclaration.js';

const visitors = [importDeclaration, importEqualsDeclaration, reExportDeclaration];

export default (sourceFile: ts.SourceFile) => visitors.map(v => v(sourceFile));
