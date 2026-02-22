import type { ParsedCLIArgs } from './cli-arguments.ts';
import { debugLogObject } from './debug.ts';
import { ConfigurationError } from './errors.ts';
import { _load } from './loader.ts';

const unwrapFunction = async (maybeFunction: unknown, options: ParsedCLIArgs) => {
  if (typeof maybeFunction === 'function') {
    try {
      return await maybeFunction(options);
    } catch (error) {
      debugLogObject('*', 'Error executing function:', error);
      throw error;
    }
  }
  return maybeFunction;
};

export async function loadResolvedConfigFile(configPath: string, options: ParsedCLIArgs) {
  const loadedValue = await _load(configPath);
  try {
    return await unwrapFunction(loadedValue, options);
  } catch (_error) {
    throw new ConfigurationError(`Error running the function from ${configPath}`);
  }
}
