import { getDependenciesFromLoaderArguments, getFirstPositionalArg } from '../index.js';

export const resolve = (binary: string, args: string[]) => {
  if (/-y|--yes/.test(args[0])) return [];
  const dependenciesFromArguments = getDependenciesFromLoaderArguments(args);
  const firstArgument = getFirstPositionalArg(args);
  return [firstArgument, ...dependenciesFromArguments];
};
