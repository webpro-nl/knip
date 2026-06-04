import { parseArgs as nodeParseArgs } from 'node:util';

type ParsedValue = any;

const isHex = /^0x[0-9a-f]+$/i;
const isDecimal = /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/;
const coerce = (value: string): string | number => (isHex.test(value) || isDecimal.test(value) ? Number(value) : value);

export interface ParsedArgs {
  _: string[];
  '--'?: string[];
  [key: string]: ParsedValue;
}

interface Opts {
  string?: string[];
  boolean?: string[];
  alias?: Record<string, string | string[]>;
  '--'?: boolean;
}

const setNested = (target: ParsedArgs, key: string, value: ParsedValue) => {
  if (!key.includes('.')) {
    target[key] = value;
    return;
  }
  const parts = key.split('.');
  let obj: Record<string, ParsedValue> = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (typeof obj[part] !== 'object' || obj[part] === null) obj[part] = {};
    obj = obj[part];
  }
  obj[parts[parts.length - 1]] = value;
};

const parseArgs = (argv: string[], opts: Opts = {}): ParsedArgs => {
  const strings = new Set(opts.string ?? []);
  const booleans = new Set(opts.boolean ?? []);
  const groups = new Map<string, string[]>();
  const canonicalOf = new Map<string, string>();

  if (opts.alias) {
    for (const key in opts.alias) {
      const names = [key, ...[opts.alias[key]].flat()];
      const isString = names.some(name => strings.has(name));
      const isBoolean = names.some(name => booleans.has(name));
      groups.set(key, names);
      for (const name of names) {
        canonicalOf.set(name, key);
        if (isString) strings.add(name);
        if (isBoolean) booleans.add(name);
      }
    }
  }
  const canonical = (name: string) => canonicalOf.get(name) ?? name;

  const args: string[] = [];
  for (const arg of argv) {
    if (typeof arg === 'string') args.push(/^-[A-Za-z]=/.test(arg) ? `-${arg}` : arg);
  }

  const { tokens } = nodeParseArgs({ args, strict: false, allowPositionals: true, tokens: true });

  const positionals: ParsedValue[] = [];
  const dd: string[] = [];
  const store = new Map<string, ParsedValue>();
  const consumed = new Set<number>();
  let terminated = false;

  const set = (name: string, value: ParsedValue) => {
    const key = canonical(name);
    const prev = store.get(key);
    if (prev === undefined) store.set(key, value);
    else if (prev === true && value === true) return;
    else if (Array.isArray(prev)) prev.push(value);
    else store.set(key, [prev, value]);
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.kind === 'option-terminator') {
      terminated = true;
    } else if (token.kind === 'positional') {
      if (terminated && opts['--']) dd.push(token.value);
      else if (!consumed.has(i)) positionals.push(coerce(token.value));
    } else if (token.value === undefined && token.rawName.startsWith('--no-')) {
      set(token.name.slice(3), false);
    } else {
      const name = token.name;
      if (booleans.has(name)) {
        set(name, token.value !== 'false');
      } else if (token.value !== undefined) {
        set(name, strings.has(name) ? token.value : coerce(token.value));
      } else {
        const next = tokens[i + 1];
        if (next?.kind === 'positional' && !consumed.has(i + 1)) {
          consumed.add(i + 1);
          set(name, strings.has(name) ? next.value : coerce(next.value));
        } else {
          set(name, strings.has(name) ? '' : true);
        }
      }
    }
  }

  for (const name of booleans) {
    const key = canonical(name);
    if (!store.has(key)) store.set(key, false);
  }

  const result: ParsedArgs = { _: positionals };
  for (const [key, value] of store) {
    for (const name of groups.get(key) ?? [key]) setNested(result, name, value);
  }
  if (opts['--']) result['--'] = dd;

  return result;
};

export default parseArgs;
