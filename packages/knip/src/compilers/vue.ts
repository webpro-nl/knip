import { scriptBodies } from './compilers.js';
import type { HasDependency } from './types.js';

const condition = (hasDependency: HasDependency) => hasDependency('vue') || hasDependency('nuxt');

const compiler = scriptBodies;

export default { condition, compiler };
