import parseArgs from '../../util/parse-args.ts';
import { parse } from 'unbash';
import { getCommandWords, walkCommands } from '../../util/scripts.ts';

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

export const parseScripts = (scripts: Record<string, string | undefined> | undefined): IO[] => {
  const out: IO[] = [];
  for (const script of Object.values(scripts ?? {})) {
    if (typeof script !== 'string' || !script.includes(BIN)) continue;
    try {
      const parsed = parse(script);
      for (const statement of parsed.commands) {
        for (const node of walkCommands(statement.command)) {
          if (node.name?.value === BIN) out.push(parseCommandIO(getCommandWords(node).map(word => word.value)));
        }
      }
    } catch {}
  }
  return out;
};
