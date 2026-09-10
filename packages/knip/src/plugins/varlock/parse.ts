type Directive = {
  name: 'import' | 'plugin';
  descriptor: string;
  enabled?: boolean | null;
  allowMissing?: boolean | null;
};

const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}' };

const getRootComments = (source: string) => {
  const comments: string[] = [];
  let block: string[] = [];
  let hasConfigItem = false;

  for (const line of source.replace(/^\uFEFF/, '').split('\n')) {
    if (!line.trim()) {
      comments.push(...block);
      block = [];
      continue;
    }
    const match = line.match(/^\s*#(.*)$/);
    if (!match) {
      hasConfigItem = true;
      break;
    }
    const content = match[1].trimStart();
    if (/^[-=*#]{3}/.test(content)) {
      comments.push(...block);
      block = [];
    } else {
      block.push(content);
    }
  }

  if (!hasConfigItem) comments.push(...block);
  return comments.join('\n');
};

const readQuoted = (value: string, start: number) => {
  const quote = value[start];
  let result = '';
  for (let index = start + 1; index < value.length; index++) {
    const char = value[index];
    if (char === quote) return { value: result, end: index + 1 };
    if (char === '\\' && value[index + 1] === quote) {
      result += quote;
      index++;
    } else {
      result += char;
    }
  }
};

const readArguments = (value: string, start: number) => {
  const args: string[] = [];
  const stack = [pairs[value[start]]];
  let argument = '';

  for (let index = start + 1; index < value.length; index++) {
    const char = value[index];
    if (char === '"' || char === "'" || char === '`') {
      const quoted = readQuoted(value, index);
      if (!quoted) return;
      argument += value.slice(index, quoted.end);
      index = quoted.end - 1;
    } else if (char === '#') {
      index = value.indexOf('\n', index);
      if (index === -1) return;
      argument += ' ';
    } else if (pairs[char]) {
      stack.push(pairs[char]);
      argument += char;
    } else if (char === stack.at(-1)) {
      stack.pop();
      if (stack.length === 0) {
        args.push(argument.trim());
        return { args, end: index + 1 };
      }
      argument += char;
    } else if (char === ',' && stack.length === 1) {
      args.push(argument.trim());
      argument = '';
    } else {
      argument += char;
    }
  }
};

const readValueEnd = (value: string, start: number) => {
  let index = start;
  while (index < value.length && !/[\s#]/.test(value[index])) {
    const char = value[index];
    if (char === '"' || char === "'" || char === '`') {
      const quoted = readQuoted(value, index);
      if (!quoted) return value.length;
      index = quoted.end;
    } else if (pairs[char]) {
      const nested = readArguments(value, index);
      if (!nested) return value.length;
      index = nested.end;
    } else {
      index++;
    }
  }
  return index;
};

const getStaticString = (value: string) => {
  const trimmed = value.trim();
  const quote = trimmed[0];
  if (quote === '"' || quote === "'" || quote === '`') {
    const quoted = readQuoted(trimmed, 0);
    return quoted?.end === trimmed.length ? quoted.value : undefined;
  }
  if (!trimmed || /[\s,)]/.test(trimmed) || trimmed.includes('$') || /^[a-z][a-z\d_]*\(/i.test(trimmed)) return;
  if (/^(?:true|false|undefined)$/i.test(trimmed)) return;
  const number = Number(trimmed);
  return Number.isFinite(number) && String(number) === trimmed ? undefined : trimmed;
};

const getBoolean = (value: string) => {
  const trimmed = value.trim();
  return trimmed === 'true' ? true : trimmed === 'false' ? false : null;
};

export const parseVarlockFile = (source: string) => {
  const directives: Directive[] = [];
  const value = getRootComments(source);
  let disabled = false;

  for (let index = 0; index < value.length;) {
    while (value[index] === ' ' || value[index] === '\t') index++;
    if (value[index] !== '@') {
      index = value.indexOf('\n', index) + 1 || value.length;
      continue;
    }

    while (index < value.length && value[index] !== '\n' && value[index] !== '#') {
      if (value[index] !== '@' || !/[a-z]/i.test(value[index + 1] ?? '')) {
        index++;
        continue;
      }
      let nameEnd = index + 2;
      while (/[a-z\d_]/i.test(value[nameEnd] ?? '')) nameEnd++;
      const name = value.slice(index + 1, nameEnd);
      let cursor = nameEnd;
      while (value[cursor] === ' ' || value[cursor] === '\t') cursor++;

      if (value[cursor] === '(') {
        const result = readArguments(value, cursor);
        if (!result) break;
        if (name === 'plugin' || name === 'import') {
          const descriptor = getStaticString(result.args[0] ?? '');
          if (descriptor !== undefined) {
            const directive: Directive = { name, descriptor };
            for (const arg of result.args.slice(1)) {
              const separator = arg.indexOf('=');
              if (separator === -1) continue;
              const key = arg.slice(0, separator).trim();
              if (key === 'enabled' || key === 'allowMissing') directive[key] = getBoolean(arg.slice(separator + 1));
            }
            directives.push(directive);
          }
        }
        index = result.end;
      } else if (value[cursor] === '=') {
        const end = readValueEnd(value, cursor + 1);
        if (name === 'disable') disabled ||= getBoolean(value.slice(cursor + 1, end)) === true;
        index = end;
      } else {
        if (name === 'disable') disabled = true;
        index = nameEnd;
      }
    }
    index = value.indexOf('\n', index) + 1 || value.length;
  }

  return { directives, disabled };
};
