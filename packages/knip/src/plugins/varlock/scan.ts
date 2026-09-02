import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import type { Input } from '../../util/input.ts';
import { toDeferResolve, toDependency } from '../../util/input.ts';
import { isDirectory, isFile, tryRealpath } from '../../util/fs.ts';
import { getPackageNameFromModuleSpecifier } from '../../util/modules.ts';
import { dirname, isInternal, join, toAbsolute } from '../../util/path.ts';
import { parseVarlockFile } from './parse.ts';

const urlSchemeMatcher = /^[a-z][a-z\d+.-]*:/i;
const exactVersionMatcher = /^\d+\.\d+\.\d+(?:-[\da-z.-]+)?(?:\+[\da-z.-]+)?$/i;

const resolvePath = (path: string, cwd: string) =>
  path.startsWith('~/') ? join(homedir(), path.slice(2)) : toAbsolute(path, cwd);

const isExternalUrl = (path: string) => path.startsWith('//') || urlSchemeMatcher.test(path);

const isLocalPath = (path: string) => path.startsWith('~/') || isInternal(path);

const getEnvironment = (paths: string[], fallback?: string) => {
  let key: string | undefined;
  const sources: Map<string, string>[] = [];
  for (const path of paths) {
    if (!isFile(path)) continue;
    const source = readFileSync(path, 'utf8');
    const parsed = parseVarlockFile(source);
    sources.push(parsed.staticValues);
    key ??= parsed.environmentKey;
  }
  if (!key) return fallback;
  let environment = process.env[key];
  if (environment === undefined) for (const values of sources) environment = values.get(key) ?? environment;
  return environment || fallback;
};

const expandLoadPath = (path: string, environment?: string) => {
  if (!isDirectory(path)) return [path];
  const paths = [join(path, '.env.schema'), join(path, '.env'), join(path, '.env.local')];
  const currentEnvironment = getEnvironment(paths, environment);
  if (currentEnvironment) {
    paths.push(join(path, `.env.${currentEnvironment}`), join(path, `.env.${currentEnvironment}.local`));
  }
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

    const { directives, disabled } = parseVarlockFile(readFileSync(realPath, 'utf8'));
    if (disabled) continue;

    for (const { name, descriptor, enabled, allowMissing } of directives) {
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
          const versionSeparator = descriptor.indexOf('@', 1);
          const version = versionSeparator === -1 ? undefined : descriptor.slice(versionSeparator + 1);
          if (packageName) {
            inputs.push(
              toDependency(packageName, {
                containingFilePath: realPath,
                optional: exactVersionMatcher.test(version ?? ''),
              })
            );
          }
        }
        continue;
      }

      if (!isLocalPath(descriptor) || enabled === false) continue;
      const importPath = resolvePath(descriptor, dirname(realPath));
      if (isFile(importPath) || isDirectory(importPath)) queue.push(...expandLoadPath(importPath, environment));
      else if (allowMissing !== true) {
        inputs.push(toDeferResolve(descriptor, { containingFilePath: realPath }));
      }
    }
  }

  return inputs;
};
