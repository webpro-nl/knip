import parseArgs from 'minimist';

export const resolve = (binary: string, args: string[]) => {
  const parsed = parseArgs(args, { boolean: ['yes', 'no'], alias: { yes: 'y', no: 'n' } });
  if (parsed.yes) return []; // Binaries with --yes don't need to be listed in package.json
  return [parsed._[0]];
};
