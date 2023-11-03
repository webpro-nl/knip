import type { Linter } from 'eslint';
export interface FlatConfig extends Linter.FlatConfig {}
const FlatConfigs: FlatConfig[];
/** @internal */
export default FlatConfigs;
