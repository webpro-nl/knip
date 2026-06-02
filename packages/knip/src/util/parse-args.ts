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
  const stringSet = new Set(opts.string ?? []);
  const booleanSet = new Set(opts.boolean ?? []);

  const groups = new Map<string, string[]>();
  const canonicalOf = new Map<string, string>();
  if (opts.alias) {
    for (const key in opts.alias) {
      const names = [key, ...[opts.alias[key]].flat()];
      for (const name of names) canonicalOf.set(name, key);
      groups.set(key, names);
    }
  }
  const canonical = (name: string) => canonicalOf.get(name) ?? name;

  for (const [, names] of groups) {
    if (names.some(n => stringSet.has(n))) for (const n of names) stringSet.add(n);
    if (names.some(n => booleanSet.has(n))) for (const n of names) booleanSet.add(n);
  }

  const args: string[] = [];
  for (const arg of argv) {
    if (typeof arg !== 'string') continue;
    args.push(/^-[A-Za-z]=/.test(arg) ? `-${arg}` : arg);
  }

  const { tokens } = nodeParseArgs({ args, strict: false, allowPositionals: true, tokens: true });

  const positionals: ParsedValue[] = [];
  const dd: string[] = [];
  const store = new Map<string, ParsedValue>();
  const consumed = new Set<number>();
  let afterTerminator = false;

  const isBoolean = (name: string) => booleanSet.has(name) || booleanSet.has(canonical(name));

  const set = (name: string, value: ParsedValue) => {
    const key = canonical(name);
    if (store.has(key)) {
      const prev = store.get(key);
      if (prev === true && value === true) return;
      if (Array.isArray(prev)) prev.push(value);
      else store.set(key, [prev, value]);
    } else {
      store.set(key, value);
    }
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.kind === 'option-terminator') {
      afterTerminator = true;
      continue;
    }
    if (afterTerminator) {
      if (token.kind === 'positional') {
        if (opts['--']) dd.push(token.value);
        else positionals.push(coerce(token.value));
      }
      continue;
    }
    if (token.kind === 'positional') {
      if (!consumed.has(i)) positionals.push(coerce(token.value));
      continue;
    }
    const name = token.name;
    if (token.rawName.startsWith('--no-') && token.inlineValue === undefined) {
      set(name.slice(3), false);
      continue;
    }
    const toValue = (raw: string) => (stringSet.has(name) ? raw : coerce(raw));
    let value: ParsedValue;
    if (token.inlineValue !== undefined && token.value !== undefined) {
      value = isBoolean(name) ? token.value !== 'false' : toValue(token.value);
    } else if (isBoolean(name)) {
      value = true;
    } else {
      const next = tokens[i + 1];
      if (next?.kind === 'positional' && !consumed.has(i + 1)) {
        value = toValue(next.value);
        consumed.add(i + 1);
      } else {
        value = stringSet.has(name) ? '' : true;
      }
    }
    set(name, value);
  }

  for (const name of booleanSet) {
    const key = canonical(name);
    if (!store.has(key)) store.set(key, false);
  }

  const result: ParsedArgs = { _: positionals };
  for (const [key, value] of store) {
    const names = groups.get(key) ?? [key];
    for (const name of names) setNested(result, name, value);
  }

  if (opts['--']) result['--'] = dd;

  return result;
};

export default parseArgs;
