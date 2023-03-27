import { _load } from './loader.js';
import { timerify } from './Performance.js';

export const toCamelCase = (name: string) =>
  name.toLowerCase().replace(/(-[a-z])/g, group => group.toUpperCase().replace('-', ''));

export const hasDependency = (dependencies: Set<string>, values: (string | RegExp)[]) =>
  values.some(value => {
    if (typeof value === 'string') {
      return dependencies.has(value);
    } else if (value instanceof RegExp) {
      for (const dependency of dependencies) {
        if (value.test(dependency)) return true;
      }
    }
    return false;
  });

export const load = timerify(_load);
