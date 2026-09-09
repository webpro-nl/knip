import { type Command, parse, type Script, type Statement, type Word } from 'unbash';
import type { FromArgs, GetInputsFromScriptsOptions } from '../types/config.ts';
import { debugLogObject } from '../util/debug.ts';
import type { Input } from '../util/input.ts';
import { extractBinary, isValidBinary } from '../util/modules.ts';
import { relative } from '../util/path.ts';
import { substringBefore, truncate } from '../util/string.ts';
import { walkCommands } from '../util/scripts.ts';
import { getDependenciesFromCommand } from './command.ts';
import { toScript } from './util.ts';

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

  // Helper for recursive calls; Word args re-serialize from their raw text, string args are script fragments
  const fromArgs: FromArgs = (args, opts): Input[] => {
    if (args.length === 0) return [];
    const first = typeof args[0] === 'string' ? args[0] : args[0].value;
    if (!isValidBinary(substringBefore(first, ' '))) return [];
    return getDependenciesFromScript(toScript(args), {
      ...options,
      knownBinsOnly: false,
      ...opts,
    });
  };

  const fromWords = (words: Word[], opts: GetInputsFromScriptsOptions): Input[] => {
    const script = words
      .filter(word => word.text !== '--')
      .map(word => word.text)
      .join(' ');
    return getDependenciesFromScript(script, opts);
  };

  const definedFunctions = new Set<string>();
  const collectFunctionNames = (statements: Statement[]): void => {
    for (const stmt of statements) if (stmt.command.type === 'Function') definedFunctions.add(stmt.command.name.text);
  };

  const processScript = (s: Script): Input[] => {
    collectFunctionNames(s.commands);
    const pending: Script[] = [];
    const mainDeps: Input[] = [];
    for (const statement of s.commands) {
      for (const command of walkCommands(statement.command)) mainDeps.push(...processCommand(command, pending));
    }
    const expansionDeps = pending.flatMap(inner => processScript(inner));
    return [...mainDeps, ...expansionDeps];
  };

  const processCommand = (node: Command, pending: Script[]): Input[] => {
    if (node.name) collectExpansionScripts(node.name, pending);
    for (const prefix of node.prefix) if (prefix.value) collectExpansionScripts(prefix.value, pending);
    for (const suffix of node.suffix) collectExpansionScripts(suffix, pending);

    if (definedFunctions.size && node.name && definedFunctions.has(extractBinary(node.name.value))) return [];

    return getDependenciesFromCommand(node, { ...options, fromArgs }, fromWords);
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
