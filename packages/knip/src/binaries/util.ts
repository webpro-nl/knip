import parseArgs from '../util/parse-args.ts';
import type { BinaryResolverOptions, GetInputsFromScriptsOptions } from '../types/config.ts';
import type { Input } from '../util/input.ts';

export const argsFrom = (args: string[], from: string) => args.slice(args.indexOf(from));

export const argsAfter = (args: string[], token: string) => {
  const index = args.indexOf(token);
  return index === -1 ? [] : args.slice(index + 1).filter(arg => arg !== '--');
};

export const expandScript = (
  name: string,
  forwardedArgs: string[],
  scripts: Record<string, string> | undefined,
  options: BinaryResolverOptions,
  opts: Partial<GetInputsFromScriptsOptions> = {}
): Input[] | undefined => {
  const source = scripts?.[name];
  if (!source || forwardedArgs.length === 0) return;
  const expandedScripts = options.expandedScripts ?? new Set();
  if (expandedScripts.has(name)) return;
  expandedScripts.add(name);
  return options.fromArgs([source, ...forwardedArgs], { ...opts, expandedScripts });
};

export const parseNodeArgs = (args: string[]) =>
  parseArgs(args, {
    string: ['r'],
    alias: { require: ['r', 'loader', 'experimental-loader', 'test-reporter', 'watch', 'import'] },
  });
