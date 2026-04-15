import { createRequire } from 'node:module';
import { timerify } from './Performance.ts';

const require = createRequire(process.cwd());
export const _require = timerify(require);
