import { type Command, type Node, parse } from 'unbash';
import { extractBinary } from './modules.ts';

export interface ScriptCommand {
  binary: string;
  args: string[];
}

const spawningBinaries = new Set(['cross-env', 'retry-cli']);

export function* walkCommands(node: Node): Generator<Command> {
  switch (node.type) {
    case 'Command':
      yield node;
      break;
    case 'AndOr':
    case 'Pipeline':
      for (const command of node.commands) yield* walkCommands(command);
      break;
    case 'If':
      for (const statement of node.clause.commands) yield* walkCommands(statement.command);
      for (const statement of node.then.commands) yield* walkCommands(statement.command);
      if (node.else) yield* walkCommands(node.else);
      break;
    case 'While':
      for (const statement of node.clause.commands) yield* walkCommands(statement.command);
      for (const statement of node.body.commands) yield* walkCommands(statement.command);
      break;
    case 'For':
    case 'Select':
    case 'Subshell':
    case 'BraceGroup':
      for (const statement of node.body.commands) yield* walkCommands(statement.command);
      break;
    case 'CompoundList':
      for (const statement of node.commands) yield* walkCommands(statement.command);
      break;
    case 'Function':
    case 'Coproc':
      yield* walkCommands(node.body);
      break;
    case 'Statement':
      yield* walkCommands(node.command);
      break;
  }
}

export const getScriptCommands = (script: string): ScriptCommand[] => {
  if (!script) return [];
  let parsed: ReturnType<typeof parse>;
  try {
    parsed = parse(script);
  } catch {
    return [];
  }
  if (!parsed.commands) return [];
  const out: ScriptCommand[] = [];
  for (const statement of parsed.commands) {
    for (const node of walkCommands(statement.command)) {
      const text = node.name?.value;
      if (!text) continue;
      const binary = extractBinary(text);
      const args = node.suffix.map(word => word.value);
      if (spawningBinaries.has(binary)) out.push(...getScriptCommands(args.filter(arg => arg !== '--').join(' ')));
      else out.push({ binary, args });
    }
  }
  return out;
};
