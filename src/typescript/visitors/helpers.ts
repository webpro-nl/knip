import ts from 'typescript';
import { BoundSourceFile } from '../SourceFile.js';

export const isNotJS = (sourceFile: BoundSourceFile) =>
  sourceFile.scriptKind !== ts.ScriptKind.JS && sourceFile.scriptKind !== ts.ScriptKind.JSX;

export const isJS = (sourceFile: BoundSourceFile) =>
  sourceFile.scriptKind === ts.ScriptKind.JS || sourceFile.scriptKind === ts.ScriptKind.JSX;
