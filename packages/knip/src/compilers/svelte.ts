import { importsWithinScripts } from './compilers.js';
import type { HasDependency } from './types.js';

const condition = (hasDependency: HasDependency) => hasDependency('svelte');

const compiler = importsWithinScripts;

export default { condition, compiler };
