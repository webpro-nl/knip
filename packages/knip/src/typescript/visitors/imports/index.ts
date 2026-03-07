import type ts from 'typescript';
import importDeclaration from './importDeclaration.ts';
import importEqualsDeclaration from './importEqualsDeclaration.ts';
import reExportDeclaration from './reExportDeclaration.ts';

const visitors = [importDeclaration, importEqualsDeclaration, reExportDeclaration];

export default (sourceFile: ts.SourceFile) => visitors.map(v => v(sourceFile));
