import parseArgs from 'minimist';
import type { BinaryResolver } from '../../types/config.js';
import { isFile } from '../../util/fs.js';
import { toEntry } from '../../util/input.js';
import { isAbsolute, join } from '../../util/path.js';
import { resolveX } from './bunx.js';

const commands = ['add', 'create', 'init', 'install', 'link', 'pm', 'remove', 'run', 'test', 'update', 'upgrade', 'x'];

export const resolve: BinaryResolver = (_binary, args, options) => {
  const parsed = parseArgs(args);
  const [command, script] = parsed._;

  if (command === 'x') {
    const argsForX = args.filter(arg => arg !== 'x');
    return resolveX(argsForX, options);
  }

  const { manifestScriptNames, cwd, fromArgs } = options;

  if (command === 'run' && manifestScriptNames.has(script)) return [];
  if (manifestScriptNames.has(command) || commands.includes(command)) return [];
  const filePath = command === 'run' ? script : command;
  const absFilePath = isAbsolute(filePath) ? filePath : join(cwd, filePath);
  if (isFile(absFilePath)) return [toEntry(absFilePath)];
  return fromArgs(args);
};
