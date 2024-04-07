import type ts from 'typescript';
import importCall from './importCall.js';
import importType from './importType.js';
import jsDocType from './jsDocType.js';
import propertyAccessCall from './propertyAccessCall.js';
import requireCall from './requireCall.js';

const visitors = [importCall, importType, jsDocType, propertyAccessCall, requireCall];

export default (sourceFile: ts.SourceFile) => visitors.map(v => v(sourceFile));
