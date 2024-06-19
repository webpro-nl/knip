import type ts from 'typescript';
import bun from './bun.js';
import execa from './execa.js';
import zx from './zx.js';

const visitors = [bun, execa, zx];

export default (sourceFile: ts.SourceFile) => visitors.map(v => v(sourceFile));
