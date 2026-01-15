import { fix } from './IssueFixer.js';
import { run } from './run.js';
import type { MainOptions } from './util/create-options.js';

export const main = async (options: MainOptions) => {
  const { results } = await run(options);
  if (options.isFix) await fix(results.issues, options);
  return results;
};
