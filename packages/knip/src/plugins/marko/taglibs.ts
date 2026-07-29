import { readdirSync } from 'node:fs';
import { isFile, loadJSON } from '../../util/fs.ts';
import { basename, dirname, join } from '../../util/path.ts';

const dependencyFields = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getDependencies = async (cwd: string) => {
  const manifest: unknown = await loadJSON(join(cwd, 'package.json'));
  const dependencies = new Set<string>();
  if (!isRecord(manifest)) return dependencies;
  for (const field of dependencyFields) {
    const values = manifest[field];
    if (isRecord(values)) for (const packageName in values) dependencies.add(packageName);
  }
  return dependencies;
};

const findConfig = (cwd: string, packageName: string) => {
  let dir = cwd;
  while (true) {
    const filePath = join(dir, 'node_modules', packageName, 'marko.json');
    if (isFile(filePath)) return filePath;
    const parent = dirname(dir);
    if (parent === dir) return;
    dir = parent;
  }
};

const readDir = (dir: string) => {
  try {
    return readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
};

const getTagName = (fileName: string) => (fileName.endsWith('.marko') ? basename(fileName, '.marko') : undefined);
const isTagDir = (dir: string, name: string) => isFile(dir, 'index.marko') || isFile(dir, `${name}.marko`);

const getExportedTags = (dir: string) => {
  const tags = new Set<string>();
  for (const entry of readDir(dir)) {
    if (entry.name.startsWith('.')) continue;
    if (entry.isFile()) {
      const name = getTagName(entry.name);
      if (name) tags.add(name);
      continue;
    }
    if (!entry.isDirectory()) continue;
    const tagDir = join(dir, entry.name);
    if (isTagDir(tagDir, entry.name)) {
      tags.add(entry.name);
      continue;
    }
    if (entry.name === 'tags' || entry.name === 'components') continue;
    for (const child of readDir(tagDir)) {
      if (child.isFile()) {
        const name = getTagName(child.name);
        if (name) tags.add(name);
      } else if (child.isDirectory() && isTagDir(join(tagDir, child.name), child.name)) {
        tags.add(child.name);
      }
    }
  }
  return tags;
};

export const getTaglibDependencies = async (cwd: string) => {
  const tagDependencies = new Map<string, string[]>();
  const fallbackDependencies: string[] = [];
  for (const packageName of await getDependencies(cwd)) {
    const configPath = findConfig(cwd, packageName);
    if (!configPath) continue;
    let config: unknown;
    try {
      config = await loadJSON(configPath);
    } catch {
      fallbackDependencies.push(packageName);
      continue;
    }
    if (!isRecord(config) || typeof config.exports !== 'string') {
      fallbackDependencies.push(packageName);
      continue;
    }
    for (const tagName of getExportedTags(join(dirname(configPath), config.exports))) {
      const dependencies = tagDependencies.get(tagName);
      if (dependencies) dependencies.push(packageName);
      else tagDependencies.set(tagName, [packageName]);
    }
  }
  return { tagDependencies, fallbackDependencies };
};
