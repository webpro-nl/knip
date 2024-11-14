import { tsScriptBodies } from './compilers.js';
import type { HasDependency } from './types.js';

const condition = (hasDependency: HasDependency) => hasDependency('vue') || hasDependency('nuxt');

const compiler = tsScriptBodies;

export default { condition, compiler };
