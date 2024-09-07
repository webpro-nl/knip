import { createRequire } from 'node:module';
import { timerify } from './Performance.js';
import { cwd } from './path.js';

const require = createRequire(cwd);
export const _require = timerify(require);
