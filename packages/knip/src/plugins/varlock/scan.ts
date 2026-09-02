import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import type { Input } from '../../util/input.ts';
import { toDeferResolve, toDependency } from '../../util/input.ts';
import { isDirectory, isFile, tryRealpath } from '../../util/fs.ts';
import { getPackageNameFromModuleSpecifier } from '../../util/modules.ts';
import { dirname, isInternal, join, toAbsolute } from '../../util/path.ts';

type Directive = { name: 'import' | 'plugin'; args: string[] };

const urlSchemeMatcher = /^[a-z][a-z\d+.-]*:/i;

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

const getDirectives = (source: string) => {
  const directives: Directive[] = [];
  const value = getDecoratorSource(source);
  let disabled = false;

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
      if (name === 'disable' && unquote(value.slice(cursor, end)) === 'true') disabled = true;
      index = end;
    } else if (value[cursor] === '(') {
      const end = scanSyntax(value, cursor, false);
      if ((name === 'plugin' || name === 'import') && value[end - 1] === ')') {
        directives.push({ name, args: splitArguments(value.slice(cursor + 1, end - 1)) });
      }
      index = end;
    } else {
      if (name === 'disable') disabled = true;
      index = cursor;
    }
  }

  return { directives, disabled };
};

const hasOption = (args: string[], name: string, value: string) => {
  for (let i = 1; i < args.length; i++) {
    const separator = args[i].indexOf('=');
    if (separator !== -1 && args[i].slice(0, separator).trim() === name) {
      return unquote(args[i].slice(separator + 1)) === value;
    }
  }
  return false;
};

const resolvePath = (path: string, cwd: string) =>
  path.startsWith('~/') ? join(homedir(), path.slice(2)) : toAbsolute(path, cwd);

const isExternalUrl = (path: string) => path.startsWith('//') || urlSchemeMatcher.test(path);

const isLocalPath = (path: string) => path.startsWith('~/') || isInternal(path);

const expandLoadPath = (path: string, environment?: string) => {
  if (!isDirectory(path)) return [path];
  const paths = [join(path, '.env.schema'), join(path, '.env'), join(path, '.env.local')];
  if (environment) paths.push(join(path, `.env.${environment}`), join(path, `.env.${environment}.local`));
  return paths;
};

export const scanVarlockFiles = (paths: string[], cwd: string, environment?: string) => {
  const inputs: Input[] = [];
  const queue: string[] = [];
  for (const path of paths) queue.push(...expandLoadPath(resolvePath(path, cwd), environment));
  const visited = new Set<string>();

  for (const path of queue) {
    if (!isFile(path)) continue;
    const realPath = tryRealpath(path);
    if (visited.has(realPath)) continue;
    visited.add(realPath);

    const { directives, disabled } = getDirectives(readFileSync(realPath, 'utf8'));
    if (disabled) continue;

    for (const { name, args } of directives) {
      const descriptor = unquote(args[0] ?? '');
      if (!descriptor || descriptor.includes('$') || isExternalUrl(descriptor)) continue;

      if (name === 'plugin') {
        if (isLocalPath(descriptor)) {
          inputs.push(
            toDeferResolve(descriptor.startsWith('~/') ? resolvePath(descriptor, dirname(realPath)) : descriptor, {
              containingFilePath: realPath,
            })
          );
        } else {
          const packageName = getPackageNameFromModuleSpecifier(descriptor);
          if (packageName) inputs.push(toDependency(packageName, { containingFilePath: realPath }));
        }
        continue;
      }

      if (!isLocalPath(descriptor) || hasOption(args, 'enabled', 'false')) continue;
      const importPath = resolvePath(descriptor, dirname(realPath));
      if (isFile(importPath) || isDirectory(importPath)) queue.push(...expandLoadPath(importPath, environment));
      else if (!hasOption(args, 'allowMissing', 'true')) {
        inputs.push(toDeferResolve(descriptor, { containingFilePath: realPath }));
      }
    }
  }

  return inputs;
};
