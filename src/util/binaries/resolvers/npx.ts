import parseArgs from 'minimist';
import type { PackageJson } from 'type-fest';

type FindByArgs = (args: string[]) => string[];

export const resolve = (binary: string, args: string[], cwd: string, manifest: PackageJson, findByArgs: FindByArgs) => {
  const parsed = parseArgs(args, { '--': true, stopEarly: true, boolean: ['yes', 'no'], alias: { yes: 'y', no: 'n' } });
  return [...(parsed.yes ? [] : findByArgs(parsed._)), ...(parsed['--'] ? findByArgs(parsed['--']) : [])];
};
