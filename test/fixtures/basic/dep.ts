import * as ns from './ns';

const x = ns.x;
const y = ns.y;

export const dep = y(x);

export type Dep = any;

export default dep;
