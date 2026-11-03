import type { Word } from 'unbash';
import parseArgs from '../../util/parse-args.ts';
import type { BinaryResolver } from '../../types/config.ts';
import { toAbsolute } from '../../util/path.ts';
import { toCommandBinary } from '../util.ts';

const parseOptions = {
  isStorePositions: true,
  string: ['filter', 'resume-from'],
  boolean: [
    'fail-if-no-match',
    'parallel',
    'recursive',
    'report-summary',
    'reverse',
    'shell-mode',
    'transitive',
    'workspace-root',
  ],
  alias: { filter: 'F', recursive: 'r', 'shell-mode': 'c', transitive: 't', 'workspace-root': 'w' },
};

const parseLeadingChdir = (words: Word[]): [dir: string | undefined, consumed: number] => {
  const first = words[0]?.value;
  if (first === '-C') return [words[1]?.value, 2];
  if (first?.startsWith('-C')) {
    const dir = first[2] === '=' ? first.slice(3) : first.slice(2);
    if (dir) return [dir, 1];
  }
  return [undefined, 0];
};

export const resolve: BinaryResolver = (_binary, _words, options) => {
  const binary = toCommandBinary(_binary, options);
  const [C, consumed] = parseLeadingChdir(_words);
  const words = _words.slice(consumed);
  const parsed = parseArgs(words, parseOptions);
  const [command] = parsed._;

  if (command !== 'exec') return [binary];

  const [execIndex, commandIndex] = parsed.positionalIndices!;
  if (commandIndex === undefined) return [binary];

  const execOptions = parseArgs(words.slice(execIndex + 1, commandIndex), parseOptions);
  if (execOptions.filter) return [binary];

  const dir = execOptions['workspace-root'] ? options.rootCwd : C ? toAbsolute(C, options.cwd) : undefined;
  const rest = words.slice(commandIndex);
  const script = rest.map(word => (execOptions['shell-mode'] ? word.value : word.text)).join(' ');
  const inputs = options.fromArgs([script], dir ? { cwd: dir } : {});
  if (dir) for (const input of inputs) input.dir ??= dir;
  return [binary, ...inputs];
};
