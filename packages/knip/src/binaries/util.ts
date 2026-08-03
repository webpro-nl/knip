import type { Word } from 'unbash';
import parseArgs from '../util/parse-args.ts';
import type { BinaryResolverOptions, GetInputsFromScriptsOptions, ScriptArg } from '../types/config.ts';
import type { Input } from '../util/input.ts';

const valueOf = (arg: string | Word) => (typeof arg === 'string' ? arg : arg.value);

export const argsFrom = <T extends string | Word>(args: readonly T[], from: string) =>
  args.slice(args.findIndex(arg => valueOf(arg) === from));

export const argsAfter = <T extends string | Word>(args: readonly T[], token: string) => {
  const index = args.findIndex(arg => valueOf(arg) === token);
  return index === -1 ? [] : args.slice(index + 1).filter(arg => valueOf(arg) !== '--');
};

export const toWordArgs = (values: (string | number)[], words: Word[]): ScriptArg[] => {
  const args: ScriptArg[] = [];
  let cursor = 0;
  for (const value of values) {
    const str = String(value);
    let match = -1;
    for (let index = cursor; index < words.length; index++) {
      if (words[index].value === str) {
        match = index;
        break;
      }
    }
    if (match === -1) args.push(str);
    else {
      args.push(words[match]);
      cursor = match + 1;
    }
  }
  return args;
};

export const expandScript = (
  name: string,
  forwardedArgs: ScriptArg[],
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
