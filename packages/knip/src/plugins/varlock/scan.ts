import { readFileSync } from 'node:fs';
import type { Input } from '../../util/input.ts';
import { toDeferResolve, toDependency } from '../../util/input.ts';
import { isDirectory, isFile, tryRealpath } from '../../util/fs.ts';
import { dirname, isAbsolute, join } from '../../util/path.ts';

const pluginMatcher = /^\s*#\s*@plugin\(\s*(?:"([^"\r\n]*)"|'([^'\r\n]*)'|([^),'"\r\n]+?))\s*\)/gm;
const importMatcher = /^\s*#\s*@import\(\s*(?:"([^"\r\n]*)"|'([^'\r\n]*)'|([^),'"\r\n]+?))\s*(?:,|\))/gm;
const packageNameMatcher = /^(?:@[a-z\d][a-z\d._-]*\/)?[a-z\d][a-z\d._-]*$/;
const exactVersionMatcher = /^\d+\.\d+\.\d+(?:-[\da-z.-]+)?(?:\+[\da-z.-]+)?$/i;

const getDescriptor = (match: RegExpExecArray) => (match[1] ?? match[2] ?? match[3])?.trim();

export const scanVarlockFiles = (paths: string[], cwd: string) => {
  const inputs: Input[] = [];
  const queue = paths.map(path => (isAbsolute(path) ? path : join(cwd, path)));
  const visited = new Set<string>();

  for (const path of queue) {
    const filePath = isDirectory(path) ? join(path, '.env.schema') : path;
    if (!isFile(filePath)) continue;
    const realPath = tryRealpath(filePath);
    if (visited.has(realPath)) continue;
    visited.add(realPath);

    const source = readFileSync(realPath, 'utf8');
    pluginMatcher.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pluginMatcher.exec(source))) {
      const descriptor = getDescriptor(match);
      if (!descriptor || descriptor.includes(':')) continue;
      if (descriptor.startsWith('./') || descriptor.startsWith('../') || descriptor.startsWith('/')) {
        inputs.push(toDeferResolve(descriptor, { containingFilePath: realPath }));
        continue;
      }

      const versionSeparator = descriptor.indexOf('@', 1);
      const packageName = versionSeparator === -1 ? descriptor : descriptor.slice(0, versionSeparator);
      const version = versionSeparator === -1 ? undefined : descriptor.slice(versionSeparator + 1);
      if (!packageNameMatcher.test(packageName) || version === '') continue;
      inputs.push(
        toDependency(packageName, { containingFilePath: realPath, optional: !!version?.match(exactVersionMatcher) })
      );
    }

    importMatcher.lastIndex = 0;
    while ((match = importMatcher.exec(source))) {
      const descriptor = getDescriptor(match);
      if (!descriptor || descriptor.includes('$') || descriptor.includes(':')) continue;
      if (descriptor.startsWith('./') || descriptor.startsWith('../') || descriptor.startsWith('/')) {
        queue.push(isAbsolute(descriptor) ? descriptor : join(dirname(realPath), descriptor));
      }
    }
  }

  return inputs;
};
