import type { GetInputsFromScripts } from '../types/config.js';
import { timerify } from '../util/Performance.js';
import { type Input, fromBinary, isBinary, isDependency } from '../util/input.js';
import { getDependenciesFromScript } from './bash-parser.js';

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
