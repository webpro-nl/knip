// Tests nsAliases traversal: namespace spread re-exported as alias
import * as Utils from './utils.js';

export const utilsAlias = { ...Utils };
