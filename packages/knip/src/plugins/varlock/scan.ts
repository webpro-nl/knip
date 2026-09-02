import { readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import type { Input } from '../../util/input.ts';
import { toDeferResolve, toDeferResolveProductionEntry, toDependency } from '../../util/input.ts';
import { isDirectory, isFile, tryRealpath } from '../../util/fs.ts';
import { getPackageNameFromModuleSpecifier } from '../../util/modules.ts';
import { dirname, isInternal, join, toAbsolute } from '../../util/path.ts';
import { isGitIgnored } from '../../util/glob-core.ts';
import { debugLog } from '../../util/debug.ts';
import { hasUrlScheme } from '../../util/url.ts';
import { parseVarlockFile } from './parse.ts';

const resolvePath = (path: string, cwd: string) =>
  path.startsWith('~/') ? join(homedir(), path.slice(2)) : toAbsolute(path, cwd);

const isExternalUrl = (path: string) => path.startsWith('//') || hasUrlScheme(path);

const isLocalPath = (path: string) => path.startsWith('~/') || isInternal(path);

const expandLoadPath = (path: string) => {
  if (!isDirectory(path)) return [path];
  try {
    const paths: string[] = [];
    for (const name of readdirSync(path)) if (name === '.env' || name.startsWith('.env.')) paths.push(join(path, name));
    return paths;
  } catch {
    return [];
  }
};

export const scanVarlockFiles = (paths: string[], cwd: string) => {
  const inputs: Input[] = [];
  const queue: string[] = [];
  for (const path of paths) queue.push(...expandLoadPath(resolvePath(path, cwd)));
  const visited = new Set<string>();

  for (const path of queue) {
    if (!isFile(path) || isGitIgnored(path)) continue;
    const realPath = tryRealpath(path);
    if (visited.has(realPath)) continue;
    visited.add(realPath);

    let source: string;
    try {
      source = readFileSync(realPath, 'utf8');
    } catch (error) {
      debugLog('Varlock', `Unable to read ${realPath} (${error instanceof Error ? error.message : error})`);
      continue;
    }
    const { directives, disabled } = parseVarlockFile(source, realPath);
    if (disabled) continue;

    for (const { name, descriptor, enabled, allowMissing } of directives) {
      if (!descriptor || descriptor.includes('$') || isExternalUrl(descriptor) || enabled === false) continue;

      if (name === 'plugin') {
        if (isLocalPath(descriptor)) {
          inputs.push(
            toDeferResolveProductionEntry(
              descriptor.startsWith('~/') ? resolvePath(descriptor, dirname(realPath)) : descriptor,
              { containingFilePath: realPath }
            )
          );
        } else {
          const packageName = getPackageNameFromModuleSpecifier(descriptor);
          if (packageName) {
            inputs.push({ ...toDependency(packageName, { containingFilePath: realPath }), production: true });
          }
        }
        continue;
      }

      if (!isLocalPath(descriptor)) continue;
      const importPath = resolvePath(descriptor, dirname(realPath));
      if (isFile(importPath) || isDirectory(importPath)) queue.push(...expandLoadPath(importPath));
      else if (allowMissing !== true && allowMissing !== null && enabled !== null) {
        inputs.push(toDeferResolve(descriptor, { containingFilePath: realPath }));
      }
    }
  }

  return inputs;
};
