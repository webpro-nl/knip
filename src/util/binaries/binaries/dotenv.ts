import { getDependenciesFromLoaderArguments } from '../index.js';

// https://www.npmjs.com/package/dotenv-cli

// TODO Lacks argument parsing (dotenv -e .env3 -v VARIABLE=somevalue <command with arguments>)

export const resolve = (binary: string, args: string[]) => {
  const dependenciesFromArguments = getDependenciesFromLoaderArguments(args);
  return [binary, args[0], ...dependenciesFromArguments];
};
