import type { BinaryResolver } from '../../types/config.ts';
import { toBinary } from '../../util/input.ts';

const execFlags = new Set(['-exec', '-execdir']);
const execTerminators = new Set([';', '\\;', '+']);

export const resolve: BinaryResolver = (binary, words, { fromArgs }) => {
  const execIdx = words.findIndex(word => execFlags.has(word.value));
  if (execIdx >= 0) {
    const cmdWords = [];
    for (let i = execIdx + 1; i < words.length; i++) {
      const v = words[i].value;
      if (execTerminators.has(v)) break;
      if (v !== '{}') cmdWords.push(words[i]);
    }
    if (cmdWords.length > 0) return [toBinary(binary), ...fromArgs(cmdWords)];
  }
  return [toBinary(binary)];
};
