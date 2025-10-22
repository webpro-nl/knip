import { stripVTControlCharacters } from 'node:util';

// biome-ignore lint: suspicious/noControlCharactersInRegex
const CONTROL_CHARACTERS = /\u001b\[[0-9;]+m/g;
export const ELLIPSIS = '…';

const getTruncatedParts = (input: string, limit: number, fromStart: boolean) => {
  const parts = [];
  let width = 0;
  let index = 0;
  let truncated = false;

  while (index < input.length) {
    CONTROL_CHARACTERS.lastIndex = index;
    const match = CONTROL_CHARACTERS.exec(input);

    if (match && match.index === index) {
      index = CONTROL_CHARACTERS.lastIndex;
      parts.push(match[0]);
      continue;
    }

    if (fromStart && width >= limit) truncated = true;
    else parts.push(input[index]);

    width++;
    index++;
  }

  if (fromStart) return { parts, truncated };

  let indexRight = 0;
  const toKeep = (value: string) => value.length > 1 || indexRight++ < limit;
  const _parts = parts.reverse().filter(toKeep);
  return { parts: _parts.reverse(), truncated: indexRight > limit };
};

export const truncate = (text: string, width: number) => {
  if (stripVTControlCharacters(text).length <= width) return text;
  const { parts, truncated } = getTruncatedParts(text, width - ELLIPSIS.length, true);
  if (!truncated) return text;
  if (parts.at(-1)?.length === 1) return parts.join('') + ELLIPSIS;
  return [...parts.slice(0, -1), ELLIPSIS, parts.at(-1)].join('');
};

export const truncateStart = (text: string, width: number) => {
  if (stripVTControlCharacters(text).length <= width) return text;
  const { parts, truncated } = getTruncatedParts(text, width - ELLIPSIS.length, false);
  if (!truncated) return text;
  if (parts[0].length === 1) return ELLIPSIS + parts.join('');
  return [parts[0], ELLIPSIS, ...parts.slice(1)].join('');
};

export const pad = (text: string, width: number, fillString?: string, align?: 'left' | 'center' | 'right') => {
  const escapedWidth = width + (text.length - stripVTControlCharacters(text).length);
  return align === 'right'
    ? text.padStart(escapedWidth, fillString)
    : align === 'center'
      ? text.padStart((text.length + escapedWidth) / 2, fillString).padEnd(escapedWidth, fillString)
      : text.padEnd(escapedWidth, fillString);
};

export const prettyMilliseconds = (ms: number): string => {
  const seconds = ms / 1000;
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m ${Math.floor(seconds % 60)}s`;
  if (minutes > 0) return `${minutes}m ${Math.floor(seconds % 60)}s`;
  if (seconds > 10) return `${Math.round(seconds)}s`;
  if (seconds > 1) return `${seconds.toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
};

/**
 * Template literal processor for commands that might be 
 * strings or arrays of strings.
 * 
 * @example
 * ```ts
 * const processor = createCommandProcessor({ '$projectRoot': '/path/to/project' });
 * 
 * console.log(processor('echo $projectRoot'));
 * // 'echo /path/to/project'
 * 
 * console.log(processor(['npx', 'tsx', '$projectRoot/server/worker.js', '--', '--force']));
 * // ['npx', 'tsx', '/path/to/project/server/worker.js', '--', '--force']
 * ```
 */
export const createCommandProcessor = <T extends object>(context: T) => {

  const templater = (template: string):string => {
    return template.replace(/\$(\w+)/g, (_, key) => {
      const value = context[key as keyof T];
      if (!value) {
        return key;
      }
      return String(value);
    });
  }

  const processor = <C extends string | string[]>(command: C): C => {
    if (typeof command === 'string') {
      return templater(command) as C;
    }

    if (Array.isArray(command)) {
      return command.map(cmd => processor(cmd)) as C;
    }

    throw new TypeError('Command must be a string or an array of strings');
  }

  return processor
}