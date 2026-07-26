import { type Dirent, existsSync, readdirSync, readFileSync } from 'node:fs';
import stripJsonComments from 'strip-json-comments';
import { dirname, join } from '../../util/path.ts';
import type { MarkoTaglib } from './types.ts';

// Marko 5 auto-scans `components`, Marko 6 `tags`, interop projects both
export const tagDiscoveryDirs = ['components', 'tags'];

const isTagDiscoveryDir = (name: string) => name === 'components' || name === 'tags';

const rendererExtensions = ['.js', '.ts', '.mjs', '.cjs', '.jsx', '.tsx', '.marko'];

const toArray = (value: string | string[] | undefined) => (typeof value === 'string' ? [value] : (value ?? []));

const readJSON = (filePath: string) => {
  try {
    return JSON.parse(stripJsonComments(readFileSync(filePath, 'utf8'), { trailingCommas: true }));
  } catch {}
};

/** Tag names a taglib declares as `"<tag-name>"` keys or inside `tags` */
const explicitTagNames = (taglib: MarkoTaglib) => {
  const names: string[] = [];
  for (const key in taglib)
    if (key.length > 2 && key.startsWith('<') && key.endsWith('>')) names.push(key.slice(1, -1));
  if (taglib.tags) for (const name in taglib.tags) names.push(name);
  return names;
};

/** Directories a taglib publishes tags from. `exports` only takes effect for installed packages. */
export const getTaglibDirs = (taglib: MarkoTaglib, isPackage: boolean) => [
  ...toArray(taglib['tags-dir']),
  ...(isPackage ? toArray(taglib.exports) : []),
];

/**
 * Marko resolves a tag directory to its template or renderer by file name convention: tag `counter`
 * in `tags/counter/` resolves to `index.marko`, `counter.marko`, `renderer.ts`, and so on.
 */
const findTagEntry = (dir: string, tagName: string) => {
  const declared = readJSON(join(dir, 'marko-tag.json'));
  const declaredEntry = declared?.template ?? declared?.renderer;
  if (typeof declaredEntry === 'string' && existsSync(join(dir, declaredEntry))) return join(dir, declaredEntry);
  for (const name of ['index.marko', `${tagName}.marko`, 'template.marko']) {
    if (existsSync(join(dir, name))) return join(dir, name);
  }
  for (const base of ['renderer', 'index', tagName]) {
    for (const extension of rendererExtensions) {
      if (existsSync(join(dir, base + extension))) return join(dir, base + extension);
    }
  }
};

const resolvePackageFile = (fromDir: string, packageName: string, fileName: string) => {
  let dir = fromDir;
  while (true) {
    const filePath = join(dir, 'node_modules', packageName, fileName);
    if (existsSync(filePath)) return filePath;
    const parent = dirname(dir);
    if (parent === dir) return;
    dir = parent;
  }
};

/**
 * Resolves Marko tag names to the file or package implementing them, the way the Marko compiler
 * discovers custom tags: without an import statement or any other reference in the source.
 */
export const createTaglibResolver = (cwd: string) => {
  const tagsDirCache = new Map<string, Map<string, string>>();
  const localTagsCache = new Map<string, Map<string, string>>();
  let packageTags: Map<string, string> | undefined;

  /** Map each tag in a `tags`/`components` directory to the file implementing it */
  const scanTagsDir = (dir: string, depth = 0): Map<string, string> => {
    const cached = tagsDirCache.get(dir);
    if (cached) return cached;
    const tags = new Map<string, string>();
    tagsDirCache.set(dir, tags);
    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return tags;
    }
    for (const entry of entries) {
      const name = entry.name;
      if (name.startsWith('.')) continue;
      if (entry.isDirectory()) {
        const tagDir = join(dir, name);
        const filePath = isTagDiscoveryDir(name) ? undefined : findTagEntry(tagDir, name);
        if (filePath) tags.set(name, filePath);
        // A directory without an entry file holds nested tags instead of being one
        else if (depth < 2) for (const [nested, filePath] of scanTagsDir(tagDir, depth + 1)) tags.set(nested, filePath);
      } else if (name.endsWith('.marko')) {
        tags.set(name.slice(0, -6), join(dir, name));
      }
    }
    return tags;
  };

  /**
   * Marko discovers tags local to a template by walking up from its directory to the package root,
   * scanning `components`/`tags` directories and any `marko.json#tags-dir` along the way.
   */
  const getLocalTags = (fromDir: string) => {
    const cached = localTagsCache.get(fromDir);
    if (cached) return cached;
    const tags = new Map<string, string>();
    localTagsCache.set(fromDir, tags);
    let dir = fromDir;
    while (dir === cwd || dir.startsWith(`${cwd}/`)) {
      const taglib: MarkoTaglib | undefined = readJSON(join(dir, 'marko.json'));
      // A `tags-dir` outside `node_modules` replaces auto-discovery at this level
      const tagsDirs = taglib ? getTaglibDirs(taglib, false) : [];
      const dirs = tagsDirs.length > 0 ? tagsDirs : tagDiscoveryDirs;
      // Tags closer to the template win, so only fill in names not seen at a deeper level
      for (const name of dirs) {
        for (const [tag, filePath] of scanTagsDir(join(dir, name))) if (!tags.has(tag)) tags.set(tag, filePath);
      }
      if (dir === cwd) break;
      dir = dirname(dir);
    }
    return tags;
  };

  const addTaglibTags = (taglibPath: string, packageName: string, tags: Map<string, string>, seen: Set<string>) => {
    if (seen.has(taglibPath)) return;
    seen.add(taglibPath);
    const taglib: MarkoTaglib | undefined = readJSON(taglibPath);
    if (!taglib) return;
    const dir = dirname(taglibPath);

    const names = explicitTagNames(taglib);
    for (const tagsDir of getTaglibDirs(taglib, true)) names.push(...scanTagsDir(join(dir, tagsDir)).keys());
    for (const name of names) if (!tags.has(name)) tags.set(name, packageName);

    for (const id of toArray(taglib['taglib-imports'])) {
      if (id.endsWith('package.json')) {
        const manifest = readJSON(join(dir, id));
        for (const name in manifest?.dependencies ?? {}) {
          const imported = resolvePackageFile(dir, name, 'marko.json');
          if (imported) addTaglibTags(imported, packageName, tags, seen);
        }
      } else {
        addTaglibTags(join(dir, id), packageName, tags, seen);
      }
    }
  };

  /**
   * Marko auto-discovers tags from every dependency shipping a root `marko.json`, so using such a tag
   * is the only reference to that package a project has.
   */
  const getPackageTags = () => {
    if (packageTags) return packageTags;
    const tags = (packageTags = new Map<string, string>());
    const manifest = readJSON(join(cwd, 'package.json'));
    if (!manifest) return tags;
    const seen = new Set<string>();
    for (const field of ['dependencies', 'peerDependencies', 'devDependencies'] as const) {
      for (const packageName in manifest[field] ?? {}) {
        // The Marko runtime itself contributes core tags like `<if>` and `<for>`
        if (packageName === 'marko') continue;
        const taglibPath = resolvePackageFile(cwd, packageName, 'marko.json');
        if (taglibPath) addTaglibTags(taglibPath, packageName, tags, seen);
      }
    }
    return tags;
  };

  /** File path for a locally discovered tag, package name for one from a dependency */
  return (tagName: string, fromDir: string) => getLocalTags(fromDir).get(tagName) ?? getPackageTags().get(tagName);
};
