import type ts from 'typescript';
import importCall from './importCall.js';
import importMetaGlobCall from './importMetaGlobCall.js';
import importType from './importType.js';
import jsDocType from './jsDocType.js';
import requireCall from './requireCall.js';
import requireContextCall from './requireContextCall.js';
import resolveCall from './resolveCall.js';

const visitors = [importCall, importType, jsDocType, resolveCall, requireCall, requireContextCall, importMetaGlobCall];

export default (sourceFile: ts.SourceFile) => visitors.map(v => v(sourceFile));
