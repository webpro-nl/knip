import { readFile, readAlias, fsNamespace, fsDefault } from './converged.js';
import * as ambiguous from './ambiguous.js';
import * as copied from './copied-barrel.js';
import type { fsTypes } from './type-barrel.js';

export type ReadStream = fsTypes.ReadStream;

console.log(readFile, readAlias, fsNamespace, fsDefault, ambiguous, copied);
