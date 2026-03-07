import type ts from 'typescript';
import type { ImportVisitor } from '../index.ts';
import importCall from './importCall.ts';
import importType from './importType.ts';
import jsDocType from './jsDocType.ts';
import moduleRegister from './moduleRegister.ts';
import requireCall from './requireCall.ts';
import resolveCall from './resolveCall.ts';
import urlConstructor from './urlConstructor.ts';

const visitors = [importCall, importType, jsDocType, moduleRegister, resolveCall, requireCall, urlConstructor];

export default (sourceFile: ts.SourceFile, extraVisitors: ImportVisitor[]) =>
  [...visitors, ...extraVisitors].map(v => v(sourceFile));
