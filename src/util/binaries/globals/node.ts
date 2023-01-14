import { getDependenciesFromLoaderArguments } from '../index.js';

export const resolve = (binary: string, args: string[]) => {
  const dependenciesFromArguments = getDependenciesFromLoaderArguments(args);
  return dependenciesFromArguments;
};
