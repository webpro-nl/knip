import parseArgs from 'minimist';

export const resolve = (binary: string, args: string[]): string[] => {
  const parsed = parseArgs(args, { string: ['r'], alias: { require: ['r', 'loader', 'experimental-loader'] } });
  return parsed.require ? [parsed.require].flat() : [];
};
