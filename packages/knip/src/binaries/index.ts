import type { GetInputsFromScripts } from '../types/config.ts';
import { fromBinary, type Input, isBinary, isDependency } from '../util/input.ts';
import { timerify } from '../util/Performance.ts';
import { getDependenciesFromScript } from './bash-parser.ts';

const getInputsFromScripts: GetInputsFromScripts = (npmScripts, options) => {
  const scripts = typeof npmScripts === 'string' ? [npmScripts] : Array.from(npmScripts);
  const results = scripts.flatMap(script => getDependenciesFromScript(script, options));
  const inputs = new Set<Input>();

  for (const input of results) {
    if (!input.specifier) continue;
    if (isDependency(input) && input.specifier.startsWith('http')) continue;
    if (isBinary(input) && !/^\b/.test(fromBinary(input))) continue;
    inputs.add(input);
  }

  return Array.from(inputs);
};

export const _getInputsFromScripts = timerify(getInputsFromScripts);
