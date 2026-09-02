export type Directive = { name: 'import' | 'plugin'; args: string[] };

const unquote = (value: string) => {
  const trimmed = value.trim();
  const quote = trimmed[0];
  return (quote === '"' || quote === "'" || quote === '`') && trimmed.at(-1) === quote ? trimmed.slice(1, -1) : trimmed;
};

const splitArguments = (value: string) => {
  const args: string[] = [];
  let start = 0;
  let depth = 0;
  let quote = '';
  let escaped = false;

  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
    } else if (char === '"' || char === "'" || char === '`') {
      quote = char;
    } else if (char === '(' || char === '[' || char === '{') {
      depth++;
    } else if (char === ')' || char === ']' || char === '}') {
      depth--;
    } else if (char === ',' && depth === 0) {
      args.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }

  args.push(value.slice(start).trim());
  return args;
};

const scanSyntax = (value: string, start: number, stopAtWhitespace: boolean) => {
  let depth = 0;
  let quote = '';
  let escaped = false;

  for (let i = start; i < value.length; i++) {
    const char = value[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
    } else if (char === '"' || char === "'" || char === '`') {
      quote = char;
    } else if (char === '(' || char === '[' || char === '{') {
      depth++;
    } else if (char === ')' || char === ']' || char === '}') {
      depth--;
      if (depth === 0 && !stopAtWhitespace) return i + 1;
    } else if (stopAtWhitespace && depth === 0 && /\s/.test(char)) {
      return i;
    }
  }
  return value.length;
};

const stripTrailingComment = (value: string) => {
  let quote = '';
  let escaped = false;
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
    } else if (char === '"' || char === "'" || char === '`') {
      quote = char;
    } else if (char === '#') {
      return value.slice(0, i);
    }
  }
  return value;
};

const getDecoratorSource = (source: string) => {
  const parts: string[] = [];
  let depth = 0;

  for (const line of source.split('\n')) {
    if (!line.trim()) continue;
    if (!line.startsWith('#')) break;
    const comment = line.slice(1).trimStart();
    if (depth === 0 && !comment.startsWith('@')) continue;

    const part = stripTrailingComment(comment);
    if (part) parts.push(part);
    let quote = '';
    let escaped = false;
    for (const char of part) {
      if (quote) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === quote) quote = '';
      } else if (char === '"' || char === "'" || char === '`') {
        quote = char;
      } else if (char === '(' || char === '[' || char === '{') {
        depth++;
      } else if (char === ')' || char === ']' || char === '}') {
        depth--;
      }
    }
  }

  return parts.join(' ');
};

export const parseVarlockDirectives = (source: string) => {
  const directives: Directive[] = [];
  const value = getDecoratorSource(source);
  let disabled = false;
  let environmentKey: string | undefined;

  for (let index = 0; index < value.length; index++) {
    const marker = value.indexOf('@', index);
    if (marker === -1) break;
    let nameEnd = marker + 1;
    while (/[a-z\d_]/i.test(value[nameEnd] ?? '')) nameEnd++;
    const name = value.slice(marker + 1, nameEnd);
    let cursor = nameEnd;
    while (value[cursor] === ' ' || value[cursor] === '\t') cursor++;

    if (value[cursor] === '=') {
      cursor++;
      while (value[cursor] === ' ' || value[cursor] === '\t') cursor++;
      const end = scanSyntax(value, cursor, true);
      const decoratorValue = unquote(value.slice(cursor, end));
      if (name === 'disable' && decoratorValue === 'true') disabled = true;
      if (name === 'currentEnv' && /^\$[A-Z_][A-Z\d_]*$/i.test(decoratorValue)) {
        environmentKey = decoratorValue.slice(1);
      } else if (name === 'envFlag' && /^[A-Z_][A-Z\d_]*$/i.test(decoratorValue)) {
        environmentKey = decoratorValue;
      }
      index = end;
    } else if (value[cursor] === '(') {
      const end = scanSyntax(value, cursor, false);
      if ((name === 'plugin' || name === 'import') && value[end - 1] === ')') {
        directives.push({ name, args: splitArguments(value.slice(cursor + 1, end - 1)) });
      }
      index = end;
    } else {
      if (name === 'disable') disabled = true;
      index = nameEnd - 1;
    }
  }

  return { directives, disabled, environmentKey };
};

export const getStaticEnvValue = (source: string, key: string) => {
  for (const line of source.split('\n').toReversed()) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z_][A-Z\d_.-]*)\s*=\s*(.*)$/i);
    if (match?.[1] !== key) continue;
    const value = unquote(stripTrailingComment(match[2]).trim());
    if (value && !value.includes('$') && !/^[a-z][a-z\d_]*\(/i.test(value)) return value;
  }
};

export const getOption = (args: string[], name: string) => {
  for (let i = 1; i < args.length; i++) {
    const separator = args[i].indexOf('=');
    if (separator !== -1 && args[i].slice(0, separator).trim() === name) {
      return unquote(args[i].slice(separator + 1));
    }
  }
};

export const getDescriptor = (args: string[]) => unquote(args[0] ?? '');
