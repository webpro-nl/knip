import { debugLogObject } from './debug.js';
import { ConfigurationError } from './errors.js';
import { _load } from './loader.js';

const unwrapFunction = async (maybeFunction: unknown) => {
  if (typeof maybeFunction === 'function') {
    try {
      return await maybeFunction();
    } catch (error) {
      debugLogObject('*', 'Error executing function:', error);
      throw error;
    }
  }
  return maybeFunction;
};

export async function loadResolvedConfigFile(configPath: string) {
  const loadedValue = await _load(configPath);
  try {
    return await unwrapFunction(loadedValue);
  } catch (_error) {
    throw new ConfigurationError(`Error running the function from ${configPath}`);
  }
}
