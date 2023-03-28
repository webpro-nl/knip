import ts from 'typescript';
import zx from './zx.js';

const visitors = [zx];

export default (sourceFile: ts.SourceFile) => visitors.map(v => v(sourceFile)).filter(v => v);
