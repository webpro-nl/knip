import { debugLogObject } from './debug.js';

export const unwrapFunction = async (maybeFunction: unknown) => {
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
