import { fix } from './IssueFixer.ts';
import { run } from './run.ts';
import type { MainOptions } from './util/create-options.ts';

export const main = async (options: MainOptions) => {
  const { results } = await run(options);
  if (options.isFix) await fix(results.issues, results.counters, options);
  return results;
};
