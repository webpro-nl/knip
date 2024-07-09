import fs from 'node:fs/promises';
// biome-ignore lint/nursery/noRestrictedImports: script
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Root } from 'mdast';
import remarkDirective from 'remark-directive';
import remarkFrontmatter from 'remark-frontmatter';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import type { Node } from 'unist';
import { u } from 'unist-builder';
import type { Plugin } from '../../knip/src/types/plugins.js';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const referenceDocsDir = path.join(rootDir, 'src/content/docs/reference');
const knipDir = path.join(rootDir, '../../packages/knip');
const pluginsDir = path.join(knipDir, 'src/plugins');
const directories = await fs.opendir(pluginsDir);
const plugins = [];

const parseFragment = (text: string) => {
  const tree = unified().use(remarkParse).parse(text);
  return tree.children;
};

const writeTree = async (tree: Node, filePath: string) => {
  try {
    const file = await unified().run(tree);
    const markdown = unified()
      .use(remarkFrontmatter, ['yaml'])
      .use(remarkDirective)
      .use(remarkStringify, {
        bullet: '-',
      })
      .stringify(file as Root);

    await fs.writeFile(filePath, markdown);
  } catch (err) {
    console.error(err);
  }
};

for await (const dir of directories) {
  if (dir.isDirectory() && dir.name !== '_template') {
    const pluginName = dir.name;
    const pluginDir = path.join(pluginsDir, pluginName);
    const plugin: Plugin = (await import(path.join(pluginDir, 'index.ts'))).default;

    const { title, enablers, config, entry, production, project } = plugin;

    plugins.push([title, pluginName]);

    const frontmatter = u('yaml', `title: ${title}\nsidebar:\n  hidden: true`);

    const defaults: Record<string, string[]> = {};
    if (config && config.length > 0) defaults.config = config;
    if (entry && entry.length > 0) defaults.entry = entry;
    if (production && production.length > 0) defaults.entry = [...(defaults.entry ?? []), ...production];
    if (project && project.length > 0) defaults.project = project;

    const en =
      Array.isArray(enablers) && enablers.length > 0
        ? [
            ...parseFragment(
              "This plugin is enabled when there's a match in `dependencies` or `devDependencies` in `package.json`:"
            ),
            u(
              'list',
              enablers.map((enabler: string | RegExp) =>
                u('listItem', [u('inlineCode', typeof enabler === 'string' ? enabler : enabler.source)])
              )
            ),
          ]
        : typeof enablers === 'string'
          ? parseFragment(enablers)
          : [u('paragraph', [u('text', 'N/A')])];

    const tree = u('root', [
      frontmatter,
      u('heading', { depth: 2 }, [u('text', 'Enabled')]),
      ...en,
      u('heading', { depth: 2 }, [u('text', 'Default configuration')]),
      ...parseFragment('This configuration is added automatically if the plugin is enabled:'),
      u('code', {
        lang: 'json title="knip.json"', // TODO How to set attributes/properties/props properly?
        value: JSON.stringify({ [pluginName]: defaults }, null, 2),
      }),
      ...parseFragment('Your custom `config` or `entry` options override default values, they are not merged.'),
      ...parseFragment('See [Plugins](../../explanations/plugins) for more details.'),
    ]);

    console.log(`Writing ${pluginName} docs to plugins/${pluginName}.md`);
    await writeTree(tree, path.join(referenceDocsDir, `plugins/${pluginName}.md`));
  }
}

plugins.sort((a, b) => (a[1] < b[1] ? -1 : 1));

const frontmatter = u('yaml', 'title: Plugins\ntableOfContents: false');

const tree = u('root', [
  frontmatter,
  u('containerDirective', { name: 'section{.columns.min200}' }, [
    u(
      'list',
      { spread: false, ordered: false },
      plugins.map(plugin =>
        u('listItem', [u('link', { title: plugin[0], url: `/reference/plugins/${plugin[1]}` }, [u('text', plugin[0])])])
      )
    ),
    u('paragraph'),
  ]),
]);

console.log('Writing plugin list to plugins.md');
await writeTree(tree, path.join(referenceDocsDir, 'plugins.md'));
