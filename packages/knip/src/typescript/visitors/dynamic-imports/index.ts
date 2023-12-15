import ts from 'typescript';
import importCall from './importCall.js';
import jsDocType from './jsDocType.js';
import propertyAccessCall from './propertyAccessCall.js';
import requireCall from './requireCall.js';

const visitors = [importCall, jsDocType, propertyAccessCall, requireCall];

export default (sourceFile: ts.SourceFile) => visitors.map(v => v(sourceFile));
