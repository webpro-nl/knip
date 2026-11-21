import type { Word } from 'unbash';
import parseArgs, { type ParsedArgs } from '../util/parse-args.ts';
import type { BinaryResolverOptions, GetInputsFromScriptsOptions, ScriptArg } from '../types/config.ts';
import { type Input, toBinary } from '../util/input.ts';

export const toCommandBinary = (
  binary: string,
  { optionalBinaries }: GetInputsFromScriptsOptions,
  inputOptions: { dir?: string } = {}
) => toBinary(binary, optionalBinaries ? { ...inputOptions, optional: true } : inputOptions);

export const npmBooleanFlags = [
  'color',
  'd',
  'dangerously-allow-all-scripts',
  'dd',
  'ddd',
  'force',
  'global',
  'ignore-scripts',
  'include-workspace-root',
  'legacy-peer-deps',
  'no',
  'offline',
  'prefer-offline',
  'prefer-online',
  'progress',
  'quiet',
  'silent',
  'strict-allow-scripts',
  'timing',
  'verbose',
  'workspaces',
  'yes',
];

export const npmBooleanAliases = {
  force: 'f',
  global: 'g',
  'include-workspace-root': 'iwr',
  quiet: 'q',
  silent: 's',
  workspaces: 'ws',
  yes: 'y',
};

const valueOf = (arg: string | Word) => (typeof arg === 'string' ? arg : arg.value);

export const nodeLoadersArgs = { import: ['r', 'experimental-loader', 'require', 'loader'] };

export const isEnvAssignment = /^\w+=/;

export const toShellAssignment = (assignment: string) => {
  const index = assignment.indexOf('=');
  return `${assignment.slice(0, index)}='${assignment.slice(index + 1).replaceAll("'", "'\\''")}'`;
};

const isGlobLikeMatch = /(^!|[*+\\(|{^$])/;
export const isGlobLike = (value: string) => isGlobLikeMatch.test(value);

export const argsFrom = <T extends string | Word>(args: readonly T[], from: string) => {
  const index = args.findIndex(arg => valueOf(arg) === from);
  return index === -1 ? [] : args.slice(index);
};

export const spawningArgs = (parsed: ParsedArgs, args: string[]) => {
  const index = parsed.positionalIndices?.[0];
  return index === undefined ? (parsed['--'] ?? []) : args.slice(index);
};

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
  const cwd = options.manifestDir ?? options.cwd;
  return options.fromArgs([source, ...forwardedArgs], { cwd, manifestDir: undefined, ...opts, expandedScripts });
};

export const parseNodeArgs = (args: string[]) =>
  parseArgs(args, {
    string: ['r'],
    alias: { require: ['r', 'loader', 'experimental-loader', 'test-reporter', 'watch', 'import'] },
  });
