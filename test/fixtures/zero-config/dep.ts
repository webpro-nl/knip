import * as ns from './ns.js';

const x = ns.x;
const y = ns.y;

export const unused = 1;

export const dep = y(x);

export type Dep = any;

export default dep;
