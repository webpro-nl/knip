import parseArgs from 'minimist';
import { type Node, parse, type Statement } from 'unbash';

const BIN = 'svelte-package';
export const DEFAULT_INPUT = 'src/lib';
export const DEFAULT_OUTPUT = 'dist';

interface IO {
  input: string;
  output: string;
}

const parseCommandIO = (args: string[]): IO => {
  const parsed = parseArgs(args, { string: ['i', 'o', 'input', 'output'], alias: { input: ['i'], output: ['o'] } });
  return { input: parsed.input ?? DEFAULT_INPUT, output: parsed.output ?? DEFAULT_OUTPUT };
};

const collectFromCommands = (statements: Statement[], out: IO[]) => {
  for (const stmt of statements) visit(stmt.command, out);
};

const visit = (node: Node, out: IO[]) => {
  switch (node.type) {
    case 'Command':
      if (node.name?.value === BIN) out.push(parseCommandIO(node.suffix.map(w => w.value)));
      return;
    case 'AndOr':
    case 'Pipeline':
      for (const n of node.commands) visit(n, out);
      return;
    case 'If':
      collectFromCommands(node.clause.commands, out);
      collectFromCommands(node.then.commands, out);
      if (node.else) visit(node.else, out);
      return;
    case 'While':
      collectFromCommands(node.clause.commands, out);
      collectFromCommands(node.body.commands, out);
      return;
    case 'For':
    case 'Select':
    case 'Subshell':
    case 'BraceGroup':
      collectFromCommands(node.body.commands, out);
      return;
    case 'CompoundList':
      collectFromCommands(node.commands, out);
      return;
    case 'Function':
    case 'Coproc':
      visit(node.body, out);
      return;
    case 'Statement':
      visit(node.command, out);
  }
};

export const parseScripts = (scripts: Record<string, string | undefined> | undefined): IO[] => {
  const out: IO[] = [];
  for (const script of Object.values(scripts ?? {})) {
    if (typeof script !== 'string' || !script.includes(BIN)) continue;
    try {
      const parsed = parse(script);
      if (parsed.commands) collectFromCommands(parsed.commands, out);
    } catch {}
  }
  return out;
};
