import type ts from 'typescript';
import reactComponent from './reactComponent.js';

const visitors = [reactComponent];

export default (sourceFile: ts.SourceFile) => visitors.map(v => v(sourceFile));
