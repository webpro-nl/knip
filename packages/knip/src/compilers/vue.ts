import { importsWithinScripts } from './compilers.js';
import type { HasDependency } from './types.js';

const condition = (hasDependency: HasDependency) => hasDependency('vue');

const compiler = importsWithinScripts;

export default { condition, compiler };
