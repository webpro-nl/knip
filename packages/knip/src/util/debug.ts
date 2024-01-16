import util from 'node:util';
import picocolors from 'picocolors';
import parsedArgValues from './cli-arguments.js';

const { debug } = parsedArgValues;

const IS_ENABLED = debug ?? false;

const inspectOptions = { maxArrayLength: null, depth: null, colors: true };

const ctx = (text: string | [string, string]) =>
  typeof text === 'string'
    ? picocolors.yellow(`[${text}]`)
    : `${picocolors.yellow(`[${text[0]}]`)} ${picocolors.cyan(text[1])}`;

// Inspect arrays, otherwise Node [will, knip, ...n-100 more items]
const logArray = (collection: string[]) => {
  console.log(util.inspect(collection.sort(), inspectOptions));
};

export const debugLog = (context: string, message: string) => {
  if (!IS_ENABLED) return;
  console.log(`${ctx(context)} ${message}`);
};

export const debugLogObject = (context: string, name: string, obj: unknown | (() => unknown)) => {
  if (!IS_ENABLED) return;
  console.log(`${ctx(context)} ${name}`);
  console.log(util.inspect(typeof obj === 'function' ? obj() : obj, inspectOptions));
};

export const debugLogArray = (
  context: string | [string, string],
  message: string,
  elements: string[] | Set<string>
) => {
  if (!IS_ENABLED) return;
  const collection = Array.from(elements);
  console.debug(`${ctx(context)} ${message} (${collection.length})`);
  logArray(collection);
};
