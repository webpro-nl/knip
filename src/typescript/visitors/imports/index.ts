import ts from 'typescript';
import importCall from './importCall.js';
import importDeclaration from './importDeclaration.js';
import importEqualsDeclaration from './importEqualsDeclaration.js';
import jsDocType from './jsDocType.js';
import reExportDeclaration from './reExportDeclaration.js';
import requireCall from './requireCall.js';
import requireResolveCall from './requireResolveCall.js';

const visitors = [
  importCall,
  importDeclaration,
  importEqualsDeclaration,
  jsDocType,
  reExportDeclaration,
  requireCall,
  requireResolveCall,
];

export default (sourceFile: ts.SourceFile) => visitors.map(v => v(sourceFile)).filter(v => v);
