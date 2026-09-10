type Directive = {
  name: 'import' | 'plugin';
  descriptor: string;
  enabled?: boolean | null;
  allowMissing?: boolean | null;
};

const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}' };

const getHeader = (source: string) => {
  const parts: string[] = [];
  const stack: string[] = [];

  for (const line of source.replace(/^\uFEFF/, '').split('\n')) {
    if (!line.trim()) continue;
    const match = line.match(/^\s*#(.*)$/);
    if (!match) break;
    const content = match[1].trimStart();
    if (stack.length === 0 && !content.startsWith('@')) continue;

    let part = '';
    let quote = '';
    let escaped = false;
    for (const char of content) {
      if (quote) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === quote) quote = '';
      } else if (char === '"' || char === "'" || char === '`') {
        quote = char;
      } else if (pairs[char]) {
        stack.push(pairs[char]);
      } else if (char === stack.at(-1)) {
        stack.pop();
      } else if (char === '#') {
        break;
      }
      part += char;
    }
    parts.push(part);
  }

  return parts.join('\n');
};

const findClosing = (value: string, start: number) => {
  const stack = [pairs[value[start]]];
  let quote = '';
  let escaped = false;

  for (let index = start + 1; index < value.length; index++) {
    const char = value[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
    } else if (char === '"' || char === "'" || char === '`') {
      quote = char;
    } else if (pairs[char]) {
      stack.push(pairs[char]);
    } else if (char === stack.at(-1)) {
      stack.pop();
      if (stack.length === 0) return index + 1;
    }
  }
};

const splitArguments = (value: string) => {
  const args: string[] = [];
  const stack: string[] = [];
  let start = 0;
  let quote = '';
  let escaped = false;

  for (let index = 0; index < value.length; index++) {
    const char = value[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
    } else if (char === '"' || char === "'" || char === '`') {
      quote = char;
    } else if (pairs[char]) {
      stack.push(pairs[char]);
    } else if (char === stack.at(-1)) {
      stack.pop();
    } else if (char === ',' && stack.length === 0) {
      args.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }

  args.push(value.slice(start).trim());
  return args;
};

const getStaticString = (value: string) => {
  const trimmed = value.trim();
  const quote = trimmed[0];
  if ((quote === '"' || quote === "'" || quote === '`') && trimmed.at(-1) === quote) return trimmed.slice(1, -1);
  if (!trimmed || trimmed.includes('$') || /^[a-z][a-z\d_]*\s*\(/i.test(trimmed)) return;
  if (/^(?:true|false|undefined|-?\d+(?:\.\d+)?)$/i.test(trimmed)) return;
  return trimmed;
};

const getBoolean = (value: string) => {
  const trimmed = value.trim();
  return trimmed === 'true' ? true : trimmed === 'false' ? false : null;
};

export const parseVarlockFile = (source: string) => {
  const directives: Directive[] = [];
  const value = getHeader(source);
  let disabled = false;

  for (let index = 0; index < value.length; index++) {
    if (value[index] !== '@' || !/[a-z]/i.test(value[index + 1] ?? '')) continue;
    let nameEnd = index + 2;
    while (/[a-z\d_]/i.test(value[nameEnd] ?? '')) nameEnd++;
    const name = value.slice(index + 1, nameEnd);
    let cursor = nameEnd;
    while (value[cursor] === ' ' || value[cursor] === '\t') cursor++;

    if (value[cursor] === '(') {
      const end = findClosing(value, cursor);
      if (end === undefined) break;
      if (name === 'plugin' || name === 'import') {
        const args = splitArguments(value.slice(cursor + 1, end - 1));
        const descriptor = getStaticString(args[0] ?? '');
        if (descriptor !== undefined) {
          const directive: Directive = { name, descriptor };
          for (const arg of args.slice(1)) {
            const separator = arg.indexOf('=');
            if (separator === -1) continue;
            const key = arg.slice(0, separator).trim();
            if (key === 'enabled' || key === 'allowMissing') directive[key] = getBoolean(arg.slice(separator + 1));
          }
          directives.push(directive);
        }
      }
      index = end - 1;
    } else if (value[cursor] === '=') {
      const start = cursor + 1;
      let end = start;
      while (end < value.length && !/\s/.test(value[end])) end++;
      if (name === 'disable') disabled ||= getBoolean(value.slice(start, end)) === true;
      index = end - 1;
    } else {
      if (name === 'disable') disabled = true;
      index = nameEnd - 1;
    }
  }

  return { directives, disabled };
};
