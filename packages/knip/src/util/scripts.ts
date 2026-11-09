import {
  type ArithmeticCommandExpansion,
  type Command,
  type CommandExpansionPart,
  forEachChild,
  type ProcessSubstitutionPart,
  type SyntaxNode,
  type Word,
} from 'unbash';

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
