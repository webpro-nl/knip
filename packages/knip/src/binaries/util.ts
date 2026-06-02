import parseArgs from '../util/parse-args.ts';

export const argsFrom = (args: string[], from: string) => args.slice(args.indexOf(from));

export const parseNodeArgs = (args: string[]) =>
  parseArgs(args, {
    string: ['r'],
    alias: { require: ['r', 'loader', 'experimental-loader', 'test-reporter', 'watch', 'import'] },
  });
