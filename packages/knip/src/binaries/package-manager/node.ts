import parseArgs from 'minimist';

export const parseNodeArgs = (args: string[]) =>
  parseArgs(args, {
    string: ['r'],
    alias: { require: ['r', 'loader', 'experimental-loader', 'test-reporter', 'watch', 'import'] },
  });
