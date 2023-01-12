import _default from './default.js';
import * as MyNamespace from './my-namespace.js';

const x = MyNamespace.x;
const y = MyNamespace.y;

export const unusedExportA = 1;
export const unusedExportB = 1;

export const exportedValue = y(x);

export type MyType = any;

export default exportedValue;
