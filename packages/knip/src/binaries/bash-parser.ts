import { type Command, forEachChild, parse, type Script, type Statement, type SyntaxNode, type Word } from 'unbash';
import type { FromArgs, GetInputsFromScriptsOptions } from '../types/config.ts';
import { debugLogObject } from '../util/debug.ts';
import type { Input } from '../util/input.ts';
import { extractBinary, isValidBinary } from '../util/modules.ts';
import { relative } from '../util/path.ts';
import { substringBefore, truncate } from '../util/string.ts';
import { isScriptExpansion } from '../util/scripts.ts';
import { getDependenciesFromCommand } from './command.ts';
import { toScript } from './util.ts';

export const getDependenciesFromScript = (script: string, options: GetInputsFromScriptsOptions): Input[] => {
  if (!script) return [];

  // Helper for recursive calls; Word args re-serialize from their raw text, string args are script fragments
  const fromArgs: FromArgs = (args, opts): Input[] => {
    if (args.length === 0) return [];
    const first = typeof args[0] === 'string' ? args[0] : args[0].value;
    if (!isValidBinary(substringBefore(first, ' '))) return [];
    return getDependenciesFromScript(toScript(args), {
      ...options,
      isForwardedArgs: false,
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
  const collectFunctionNames = (statements: readonly Statement[]): void => {
    for (const stmt of statements) if (stmt.command.type === 'Function') definedFunctions.add(stmt.command.name.text);
  };

  // Substitution scripts (in words, redirects, heredocs, arithmetic) are processed as scripts of their own
  const processScript = (s: Script): Input[] => {
    collectFunctionNames(s.commands);
    const inputs: Input[] = [];
    const visit = (node: SyntaxNode) => {
      if (node.type === 'Command') inputs.push(...processCommand(node));
      if (isScriptExpansion(node)) {
        if (node.script) inputs.push(...processScript(node.script));
      } else forEachChild(node, visit);
    };
    visit(s);
    return inputs;
  };

  const processCommand = (node: Command): Input[] => {
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
