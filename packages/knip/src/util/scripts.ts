import { type Node, parse, type Statement } from 'unbash';
import { extractBinary } from './modules.ts';

export interface ScriptCommand {
  binary: string;
  args: string[];
}

// Binaries that set up an environment and then spawn the real command from their arguments (e.g. `cross-env X=1 bun test`)
const spawningBinaries = new Set(['cross-env', 'retry-cli']);

const fromStatements = (statements: Statement[], out: ScriptCommand[]) => {
  for (const statement of statements) fromNode(statement.command, out);
};

const fromNode = (node: Node, out: ScriptCommand[]) => {
  switch (node.type) {
    case 'Command': {
      const text = node.name?.value;
      if (!text) break;
      const binary = extractBinary(text);
      const args = node.suffix.map(word => word.value);
      if (spawningBinaries.has(binary)) collect(args.filter(arg => arg !== '--').join(' '), out);
      else out.push({ binary, args });
      break;
    }
    case 'AndOr':
    case 'Pipeline':
      for (const command of node.commands) fromNode(command, out);
      break;
    case 'If':
      fromStatements(node.clause.commands, out);
      fromStatements(node.then.commands, out);
      if (node.else) fromNode(node.else, out);
      break;
    case 'While':
      fromStatements(node.clause.commands, out);
      fromStatements(node.body.commands, out);
      break;
    case 'For':
    case 'Select':
    case 'Subshell':
    case 'BraceGroup':
      fromStatements(node.body.commands, out);
      break;
    case 'CompoundList':
      fromStatements(node.commands, out);
      break;
    case 'Function':
    case 'Coproc':
      fromNode(node.body, out);
      break;
    case 'Statement':
      fromNode(node.command, out);
      break;
  }
};

const collect = (script: string, out: ScriptCommand[]) => {
  try {
    const parsed = parse(script);
    if (parsed.commands) fromStatements(parsed.commands, out);
  } catch {}
};

/**
 * Parse a package.json script into its individual commands using the same `unbash` parser as the binary resolvers.
 * Each command is split on `&&`/`||`/`;`/`|` and control flow, so callers can inspect a single invocation in isolation
 * instead of scanning the raw string (which conflates chained commands).
 */
export const getScriptCommands = (script: string): ScriptCommand[] => {
  if (!script) return [];
  const out: ScriptCommand[] = [];
  collect(script, out);
  return out;
};
