import defaultArrowFn from './default-arrow-function';
import defaultClass from './default-class';
import defaultFn from './default-function';
import defaultGenFn from './default-generator-function';
import defaultNamedClass from './default-named-class';
import defaultNamedFn from './default-named-function';
import defaultNamedGenFn from './default-named-generator-function';
import _default from './default.js';
import * as MyNamespace from './my-namespace.js';

const x = MyNamespace.x;
const y = MyNamespace.y;

export const unusedExportA = 1;
export const unusedExportB = async <T>(arg: T) => arg;

export const exportedValue = y(x);

export type MyType = any;

export default exportedValue;
