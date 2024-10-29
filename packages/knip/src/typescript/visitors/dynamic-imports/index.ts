import type ts from 'typescript';
import importCall from './importCall.js';
import importType from './importType.js';
import jsDocType from './jsDocType.js';
import requireCall from './requireCall.js';
import resolveCall from './resolveCall.js';

const visitors = [importCall, importType, jsDocType, resolveCall, requireCall];

export default (sourceFile: ts.SourceFile) => visitors.map(v => v(sourceFile));
