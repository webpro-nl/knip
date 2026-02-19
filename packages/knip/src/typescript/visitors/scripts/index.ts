import type ts from 'typescript';
import type { ScriptVisitor } from '../index.js';
import bun from './bun.js';

const visitors = [bun];

export default (sourceFile: ts.SourceFile, extraVisitors: ScriptVisitor[]) =>
  [...visitors, ...extraVisitors].map(v => v(sourceFile));
