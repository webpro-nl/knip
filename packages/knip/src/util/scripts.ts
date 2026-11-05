import {
  type ArithmeticCommandExpansion,
  type Command,
  type CommandExpansionPart,
  forEachChild,
  parse,
  type ProcessSubstitutionPart,
  type SyntaxNode,
  type Word,
} from 'unbash';
import { argsFrom } from '../binaries/util.ts';
import c8 from '../plugins/c8/index.ts';
import { extractBinary } from './modules.ts';
import parseArgs from './parse-args.ts';

export interface ScriptCommand {
  binary: string;
  args: string[];
}

const spawningBinaries = new Set(['c8', 'cross-env', 'retry-cli']);

// Argv arrays are spawned without a shell, so single-quote each element to keep the script parser from splitting on
// spaces or acting on operators, globs and expansions the process would have received literally
export const toShellCommand = (argv: string[]) => argv.map(arg => `'${arg.replaceAll("'", `'\\''`)}'`).join(' ');

export const getCommandWords = (node: Pick<Command, 'args'>) =>
  node.args.filter((arg): arg is Word => arg.type === 'Word');

// Commands of one script; substitution scripts are separate execution contexts, so the walk stops at the nodes that
// own them (see bash-parser.ts)
export const collectCommands = (root: SyntaxNode): Command[] => {
  const commands: Command[] = [];
  const visit = (node: SyntaxNode) => {
    if (node.type === 'Command') commands.push(node);
    if (!isScriptExpansion(node)) forEachChild(node, visit);
  };
  visit(root);
  return commands;
};

export const isScriptExpansion = (
  node: SyntaxNode
): node is CommandExpansionPart | ProcessSubstitutionPart | ArithmeticCommandExpansion =>
  node.type === 'CommandExpansion' || node.type === 'ProcessSubstitution' || node.type === 'ArithmeticCommandExpansion';

export const getScriptCommands = (script: string): ScriptCommand[] => {
  if (!script) return [];
  const out: ScriptCommand[] = [];
  try {
    for (const statement of parse(script).commands) {
      for (const node of collectCommands(statement.command)) {
        const text = node.name?.value;
        if (!text) continue;
        const binary = extractBinary(text);
        const words = getCommandWords(node);
        if (spawningBinaries.has(binary)) {
          const command = parseArgs(words, { boolean: c8.args?.boolean })._[0];
          const rest = command ? argsFrom(words, command) : [];
          out.push(...getScriptCommands(rest.map(word => word.text).join(' ')));
        } else out.push({ binary, args: words.map(word => word.value) });
      }
    }
  } catch {
    return [];
  }
  return out;
};
