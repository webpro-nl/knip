import type ts from 'typescript';
import type { GetImportsAndExportsOptions } from '../../types/config.ts';
import type { ExportNode } from '../../types/exports.ts';
import type { ImportNode } from '../../types/imports.ts';

type FileCondition = (sourceFile: ts.SourceFile) => boolean;
type VisitorFactory<T> = (fileCondition: FileCondition, fn: Visitor<T>) => VisitorCondition<T>;
type VisitorCondition<T> = (sourceFile: ts.SourceFile) => Visitor<T>;

type Visitor<T> = (node: ts.Node, options: GetImportsAndExportsOptions) => undefined | T | T[];

export type ImportVisitor = ReturnType<VisitorFactory<ImportNode>>;
export type ScriptVisitor = ReturnType<VisitorFactory<string>>;

const noop = () => undefined;

export const importVisitor: VisitorFactory<ImportNode> = (fileCondition, visitorFn) => sourceFile => {
  if (fileCondition(sourceFile)) {
    return (node, options) => visitorFn(node, options);
  }
  return noop;
};

export const exportVisitor: VisitorFactory<ExportNode> = (fileCondition, visitorFn) => sourceFile => {
  if (fileCondition(sourceFile)) {
    return (node, options) => visitorFn(node, options);
  }
  return noop;
};

export const scriptVisitor: VisitorFactory<string> = (fileCondition, visitorFn) => sourceFile => {
  if (fileCondition(sourceFile)) {
    return (node, options) => visitorFn(node, options);
  }
  return noop;
};
