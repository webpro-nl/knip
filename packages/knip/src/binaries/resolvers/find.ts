import type { BinaryResolver } from '../../types/config.ts';
import { toBinary } from '../../util/input.ts';

const execFlags = new Set(['-exec', '-execdir']);
const execTerminators = new Set([';', '\\;', '+']);

export const resolve: BinaryResolver = (binary, args, { fromArgs }) => {
  const execIdx = args.findIndex(a => execFlags.has(a));
  if (execIdx >= 0) {
    const cmdWords = [];
    for (let i = execIdx + 1; i < args.length; i++) {
      const v = args[i];
      if (execTerminators.has(v)) break;
      if (v !== '{}') cmdWords.push(v);
    }
    if (cmdWords.length > 0) return [toBinary(binary), ...fromArgs(cmdWords)];
  }
  return [toBinary(binary)];
};
