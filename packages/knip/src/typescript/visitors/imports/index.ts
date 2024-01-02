import ts from 'typescript';
import importCall from './importCall.js';
import importDeclaration from './importDeclaration.js';
import importEqualsDeclaration from './importEqualsDeclaration.js';
import importType from './importType.js';
import jsDocType from './jsDocType.js';
import propertyAccessCall from './propertyAccessCall.js';
import reExportDeclaration from './reExportDeclaration.js';
import requireCall from './requireCall.js';

const visitors = [
  importCall,
  importDeclaration,
  importEqualsDeclaration,
  importType,
  jsDocType,
  propertyAccessCall,
  reExportDeclaration,
  requireCall,
];

export default (sourceFile: ts.SourceFile) => visitors.map(v => v(sourceFile));
