import { run } from './run.js';
import type { MainOptions } from './util/create-options.js';

export const main = async (options: MainOptions) => (await run(options)).results;
