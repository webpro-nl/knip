import path from 'node:path';
import parseArgs from 'minimist';
import { tryResolve } from '../../require.js';
import type { ParsedArgs } from 'minimist';

const resolveArguments = {
  'ts-node': (parsed: ParsedArgs): string[] => [parsed._[0], parsed.require].flat(),
  tsx: (parsed: ParsedArgs): string[] => parsed._.filter(p => p !== 'watch'),
  default: (parsed: ParsedArgs): string[] => [parsed.require].flat(),
};

export const resolve = (binary: string, args: string[], cwd: string): string[] => {
  const parsed = parseArgs(args, { string: ['r'], alias: { require: ['r', 'loader'] } });
  const resolver = resolveArguments[binary as keyof typeof resolveArguments] ?? resolveArguments.default;
  const resolve = resolver(parsed);
  return [
    binary,
    ...resolve.flatMap(specifier => {
      if (specifier) {
        const filePath = path.join(cwd, specifier);
        if (filePath.startsWith(cwd)) {
          const resolvedFilePath = tryResolve(filePath);
          if (resolvedFilePath) return [resolvedFilePath];
        }
        return [specifier];
      }
      return [];
    }),
  ];
};
