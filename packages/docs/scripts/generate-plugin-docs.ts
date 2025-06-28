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
import type { Plugin } from '../../knip/src/types/config.js';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const referenceDocsDir = path.join(rootDir, 'src/content/docs/reference');
const knipDir = path.join(rootDir, '../../packages/knip');
const pluginsDir = path.join(knipDir, 'src/plugins');
const directories = await fs.opendir(pluginsDir);
const plugins = [];
const srcBaseUrl = new URL('webpro-nl/knip/blob/main/packages/knip/src/plugins', 'https://github.com');

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
    const mod = await import(path.join(pluginDir, 'index.ts'));
    const plugin: Plugin = mod.default;
    const docs: undefined | { note: string; entry?: string[]; production?: string[] } = mod.docs;

    const { title, enablers, args, config, entry, production, project } = plugin;

    plugins.push([title, pluginName]);

    const frontmatter = u('yaml', `title: ${title}\nsidebar:\n  hidden: true`);

    const defaults: Record<string, string[]> = {};
    if (config && config.length > 0) defaults.config = config;
    if (entry && entry.length > 0) defaults.entry = entry;
    if (docs?.entry && docs.entry.length > 0) defaults.entry = [...(defaults.entry ?? []), ...docs.entry];
    if (production && production.length > 0) defaults.entry = [...(defaults.entry ?? []), ...production];
    if (docs?.production && docs.production.length > 0)
      defaults.entry = [...(defaults.entry ?? []), ...docs.production];
    if (project && project.length > 0) defaults.project = project;

    const hasDefaultConfig = Object.values(defaults).some(v => v.length > 0);

    const enabledText =
      Array.isArray(enablers) && enablers.length > 0
        ? enablers.length === 1 && typeof enablers[0] === 'string'
          ? parseFragment(
              `This plugin is enabled if \`"${enablers[0]}"\` is listed in \`"dependencies"\` or \`"devDependencies"\` in \`package.json\`.`
            )
          : [
              ...parseFragment(
                `This plugin is enabled if there's a match in \`"dependencies"\` or \`"devDependencies"\` in \`package.json\`:`
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
          : [u('paragraph', [u('text', 'This plugin is always enabled.')])];

    const defaultConfig = hasDefaultConfig
      ? [
          u('heading', { depth: 2 }, [u('text', 'Default configuration')]),
          ...parseFragment('If this plugin is enabled, the following configuration is added automatically:'),
          u('code', {
            lang: 'json', // TODO How to set attributes/properties/props properly?
            value: JSON.stringify({ [pluginName]: defaults }, null, 2),
          }),
          ...parseFragment('Depending on local configuration, plugins may modify the defaults as shown.'),
          ...parseFragment('Custom `config` or `entry` options override default values, they are not merged.'),
          ...parseFragment(
            'See [Plugins](../../explanations/plugins) for more details about plugins and their `entry` and `config` options.'
          ),
        ]
      : [];

    const notes = docs?.note ? [u('heading', { depth: 2 }, [u('text', 'Note')]), ...parseFragment(docs.note)] : [];

    const printCode = (value: unknown): string =>
      Array.isArray(value)
        ? `[${value.map(printCode).join(', ')}]`
        : typeof value === 'function'
          ? value.toString()
          : JSON.stringify(value).replace(/([,:])/g, '$1 ');

    const argsText = args
      ? [
          ...parseFragment(
            `## Shell commands\n\nThis plugin adds argument parsing for the <code>${args.binaries ? args.binaries.join(' and ') : pluginName}</code>
            ${args.binaries && args.binaries.length > 1 ? 'binaries' : 'binary'}. Configuration:`
          ),
          ...parseFragment(
            `\`\`\`\n${Object.entries(args)
              .filter(([key]) => key !== 'binaries')
              .map(([key, value]) => `${key}: ${printCode(value)}`)
              .join('\n')}\n\`\`\``
          ),
          ...parseFragment(
            'The configuration was generated from source code. Also see [Script Parser](../../features/script-parser).'
          ),
        ]
      : [];

    const generated = parseFragment(
      `## Generated from source\n\nThis page was generated from the [${pluginName} plugin source code](${srcBaseUrl}/${dir.name}/index.ts).`
    );

    const tree = u('root', [
      frontmatter,
      u('heading', { depth: 2 }, [u('text', 'Enabled')]),
      ...enabledText,
      ...defaultConfig,
      ...notes,
      ...argsText,
      ...generated,
    ]);

    console.log(`Writing ${pluginName} docs to plugins/${pluginName}.md`);
    await writeTree(tree, path.join(referenceDocsDir, `plugins/${pluginName}.md`));
  }
}

plugins.sort((a, b) => (a[1] < b[1] ? -1 : 1));

const frontmatter = u('yaml', `title: Plugins (${plugins.length})\ntableOfContents: false`);

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
