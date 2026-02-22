import type ts from 'typescript';
import type { ScriptVisitor } from '../index.ts';
import bun from './bun.ts';

const visitors = [bun];

export default (sourceFile: ts.SourceFile, extraVisitors: ScriptVisitor[]) =>
  [...visitors, ...extraVisitors].map(v => v(sourceFile));
