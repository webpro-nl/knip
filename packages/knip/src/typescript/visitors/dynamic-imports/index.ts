import type ts from 'typescript';
import type { ImportVisitor } from '../index.js';
import importCall from './importCall.js';
import importType from './importType.js';
import jsDocType from './jsDocType.js';
import requireCall from './requireCall.js';
import resolveCall from './resolveCall.js';
import urlConstructor from './urlConstructor.js';

const visitors = [importCall, importType, jsDocType, resolveCall, requireCall, urlConstructor];

export default (sourceFile: ts.SourceFile, extraVisitors: ImportVisitor[]) =>
  [...visitors, ...extraVisitors].map(v => v(sourceFile));
