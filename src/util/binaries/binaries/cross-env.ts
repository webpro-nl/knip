import { getDependenciesFromLoaderArguments } from '../index.js';

// https://www.npmjs.com/package/cross-env

export const resolve = (binary: string, args: string[]) => {
  const dependenciesFromArguments = getDependenciesFromLoaderArguments(args);
  return [binary, args[0], ...dependenciesFromArguments];
};
