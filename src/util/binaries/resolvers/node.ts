import path from 'node:path';
import parseArgs from 'minimist';
import { isFile } from '../../fs.js';

// TODO Delegate `isFile` to `require.resolve`, but include `.ts` files.
// However, general direction seems to include extension anyway (ESM, TS, Deno)
// For now, only exact path matches with the following extensions are valid
const ext = /\.[cm]?[jt]s$/;

// Binaries that target an entry file with the first positional argument
const resolvePositionalFor = ['node', 'ts-node', 'tsx'];

export const resolve = (binary: string, args: string[], cwd: string): string[] => {
  const parsed = parseArgs(args, { string: ['r'], alias: { require: ['r', 'loader', 'experimental-loader'] } });
  const resolve = [parsed.require].flat();
  if (resolvePositionalFor.includes(binary)) resolve.push(parsed._[0]);
  return resolve.flatMap(specifier => {
    if (specifier) {
      const filePath = path.join(cwd, specifier);
      if (ext.test(filePath) && isFile(filePath)) {
        if (filePath.startsWith(cwd)) {
          return [filePath];
        } else {
          return [];
        }
      }
      return [specifier];
    }
    return [];
  });
};
