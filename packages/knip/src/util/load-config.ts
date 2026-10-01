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

const isObject = (value: unknown) => typeof value === 'object' && value !== null && !Array.isArray(value);

export async function loadResolvedConfigFile(configPath: string, options: ParsedCLIArgs) {
  const loadedValue = await _load(configPath);
  let config;
  try {
    config = await unwrapFunction(loadedValue, options);
  } catch (_error) {
    throw new ConfigurationError(`Error running the function from ${configPath}`);
  }
  if (!isObject(config)) throw new ConfigurationError(`Expected an object as configuration from ${configPath}`);
  return config;
}
