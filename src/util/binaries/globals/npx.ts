import { getDependenciesFromLoaderArguments } from '../index.js';

export const resolve = (binary: string, args: string[]) => {
  if (/-y|--yes/.test(args[0])) return [];
  const dependenciesFromArguments = getDependenciesFromLoaderArguments(args);
  const firstArgument = args.find(arg => !arg.startsWith('-'));
  return [firstArgument, ...dependenciesFromArguments];
};
