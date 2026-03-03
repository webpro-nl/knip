import { parse, type Node, type Script, type Statement, type Word } from 'unbash';
import { Plugins, pluginArgsMap } from '../plugins.ts';
import type { FromArgs, GetInputsFromScriptsOptions } from '../types/config.ts';
import { debugLogObject } from '../util/debug.ts';
import { type Input, toBinary, toDeferResolve } from '../util/input.ts';
import { extractBinary, isValidBinary } from '../util/modules.ts';
import { relative } from '../util/path.ts';
import { truncate } from '../util/string.ts';
import { resolve as fallbackResolve } from './fallback.ts';
import PackageManagerResolvers from './package-manager/index.ts';
import { resolve as resolverFromPlugins } from './plugins.ts';
import { parseNodeArgs } from './util.ts';

type KnownResolver = keyof typeof PackageManagerResolvers;

const spawningBinaries = ['cross-env', 'retry-cli'];

const collectExpansionScripts = (word: Word, out: Script[]) => {
  if (!word.parts) return;
  for (const part of word.parts) {
    if ((part.type === 'CommandExpansion' || part.type === 'ProcessSubstitution') && part.script) {
      out.push(part.script);
    } else if (part.type === 'DoubleQuoted' || part.type === 'LocaleString') {
      for (const child of part.parts) {
        if (child.type === 'CommandExpansion' && child.script) out.push(child.script);
      }
    }
  }
};

export const getDependenciesFromScript = (script: string, options: GetInputsFromScriptsOptions): Input[] => {
  if (!script) return [];

  // Helper for recursive calls
  const fromArgs: FromArgs = (args, opts): Input[] => {
    if (args.length === 0 || !isValidBinary(args[0].split(' ')[0])) return [];
    return getDependenciesFromScript(args.filter(arg => arg !== '--').join(' '), {
      ...options,
      knownBinsOnly: false,
      ...opts,
    });
  };

  const definedFunctions = new Set<string>();
  const collectFunctionNames = (statements: Statement[]): void => {
    for (const stmt of statements) if (stmt.command.type === 'Function') definedFunctions.add(stmt.command.name.text);
  };

  const processScript = (s: Script): Input[] => {
    collectFunctionNames(s.commands);
    const pending: Script[] = [];
    const mainDeps = getDependenciesFromStatements(s.commands, pending);
    const expansionDeps = pending.flatMap(inner => processScript(inner));
    return [...mainDeps, ...expansionDeps];
  };

  const getDependenciesFromStatements = (statements: Statement[], pending: Script[]): Input[] =>
    statements.flatMap(stmt => getDependenciesFromNode(stmt.command, pending));

  const getDependenciesFromNode = (node: Node, pending: Script[]): Input[] => {
    switch (node.type) {
      case 'Command': {
        const text = node.name?.value;
        const binary = text ? extractBinary(text) : text;

        if (node.name) collectExpansionScripts(node.name, pending);
        for (const prefix of node.prefix) if (prefix.value) collectExpansionScripts(prefix.value, pending);
        for (const suffix of node.suffix) collectExpansionScripts(suffix, pending);

        // Bunch of early bail outs for things we can't or don't want to resolve
        if (!binary || binary === '.' || binary === 'source' || binary === '[') return [];
        if (binary.startsWith('-') || binary.startsWith('..')) return [];
        if (definedFunctions.has(binary)) return [];

        const args = node.suffix.map(w => w.value);

        // Commands that precede other commands, try again with the rest
        if (['!', 'test'].includes(binary)) return fromArgs(args);

        const fromNodeOptions = node.prefix
          .filter(a => a.name === 'NODE_OPTIONS' && a.value)
          .map(a => a.value!.value)
          .map(arg => parseNodeArgs(arg.split(' ')))
          .filter(args => args.require)
          .flatMap(arg => arg.require)
          .map(id => toDeferResolve(id));

        if (binary in PackageManagerResolvers) {
          const resolver = PackageManagerResolvers[binary as KnownResolver];
          return resolver(binary, args, { ...options, fromArgs });
        }

        if (pluginArgsMap.has(binary)) {
          return [...resolverFromPlugins(binary, args, { ...options, fromArgs }), ...fromNodeOptions];
        }

        if (spawningBinaries.includes(binary)) {
          const rest = node.suffix.filter(w => w.text !== '--').map(w => w.text).join(' ');
          return [toBinary(binary), ...getDependenciesFromScript(rest, options)];
        }

        if (binary in Plugins) {
          return [...fallbackResolve(binary, args, { ...options, fromArgs }), ...fromNodeOptions];
        }

        // Before using the fallback resolver, we need a way to bail out for scripts in CI environments like GitHub
        // Actions, which are provisioned with lots of unknown global binaries.
        if (options.knownBinsOnly && !text?.startsWith('.')) return [];

        return [...fallbackResolve(binary, args, { ...options, fromArgs }), ...fromNodeOptions];
      }
      case 'AndOr':
      case 'Pipeline':
        return node.commands.flatMap(n => getDependenciesFromNode(n, pending));
      case 'If':
        return [
          ...getDependenciesFromStatements(node.clause.commands, pending),
          ...getDependenciesFromStatements(node.then.commands, pending),
          ...(node.else ? getDependenciesFromNode(node.else, pending) : []),
        ];
      case 'While':
        return [
          ...getDependenciesFromStatements(node.clause.commands, pending),
          ...getDependenciesFromStatements(node.body.commands, pending),
        ];
      case 'For':
      case 'Select':
      case 'Subshell':
      case 'BraceGroup':
        return getDependenciesFromStatements(node.body.commands, pending);
      case 'CompoundList':
        return getDependenciesFromStatements(node.commands, pending);
      case 'Function':
      case 'Coproc':
        return getDependenciesFromNode(node.body, pending);
      case 'Statement':
        return getDependenciesFromNode(node.command, pending);
      default:
        return [];
    }
  };

  try {
    const parsed = parse(script);
    if (!parsed.commands) return [];
    return processScript(parsed);
  } catch (error) {
    const msg = `Warning: failed to parse and ignoring script in ${relative(options.cwd, options.containingFilePath)} (${truncate(script, 30)})`;
    debugLogObject('*', msg, error);
    return [];
  }
};
