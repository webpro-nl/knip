import util from 'node:util';
import picocolors from 'picocolors';
import parsedArgValues from './cli-arguments.js';
import { relative } from './path.js';

const { debug, trace } = parsedArgValues;

const IS_DEBUG_ENABLED = debug ?? false;
const IS_TRACE_ENABLED = trace ?? false;

const noop = () => {};

const inspectOptions = { maxArrayLength: null, depth: null, colors: true };

/** @public */
export const inspect = (obj: unknown) => console.log(util.inspect(obj, inspectOptions));

const ctx = (text: string | [string, string]) =>
  typeof text === 'string'
    ? picocolors.yellow(`[${text}]`)
    : `${picocolors.yellow(`[${text[0]}]`)} ${picocolors.cyan(text[1])}`;

// Inspect arrays, otherwise Node [will, knip, ...n-100 more items]
const logArray = (collection: string[]) => {
  console.log(util.inspect(collection.sort(), inspectOptions));
};

export const debugLog = IS_DEBUG_ENABLED
  ? (context: string, message: string) => console.log(`${ctx(context)} ${message}`)
  : noop;

export const debugLogObject = IS_DEBUG_ENABLED
  ? (context: string, name: string, obj: unknown | (() => unknown)) => {
      console.log(`${ctx(context)} ${name}`);
      console.log(util.inspect(typeof obj === 'function' ? obj() : obj, inspectOptions));
    }
  : noop;

export const debugLogArray = IS_DEBUG_ENABLED
  ? (context: string | [string, string], message: string, elements: string[] | Set<string>) => {
      const collection = Array.from(elements);
      console.debug(`${ctx(context)} ${message} (${collection.length})`);
      logArray(collection);
    }
  : noop;

const levels = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨'];
export const exportLookupLog = IS_TRACE_ENABLED
  ? (depth: number, message: string, filePath: string) => {
      if (depth === -1) console.log('\n' + message, relative(filePath));
      else console.log(new Array(depth + 1).join('  '), levels[depth], message, relative(filePath));
    }
  : noop;
