import { importsWithinScripts } from './compilers.js';
import type { HasDependency } from './types.js';

/** @public */
export const condition = (hasDependency: HasDependency) => hasDependency('svelte');
/** @public */
export const compiler = importsWithinScripts;
