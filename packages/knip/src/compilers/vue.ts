import { importsWithinScripts } from './compilers.js';
import type { HasDependency } from './types.js';

export const condition = (hasDependency: HasDependency) => hasDependency('vue');
export const compiler = importsWithinScripts;
