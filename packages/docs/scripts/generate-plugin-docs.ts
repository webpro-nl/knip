import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Plugin } from '../../knip/src/types/config.ts';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const referenceDocsDir = path.join(rootDir, 'src/content/docs/reference');
const knipDir = path.join(rootDir, '../../packages/knip');
const pluginsDir = path.join(knipDir, 'src/plugins');
const directories = await fs.opendir(pluginsDir);
const plugins: Array<[string, string]> = [];
const srcBaseUrl = new URL('webpro-nl/knip/blob/main/packages/knip/src/plugins', 'https://github.com');

const codeBlock = (value: string, lang = '') => `\`\`\`${lang}\n${value}\n\`\`\``;

const looseList = (items: string[]) => items.map(item => `- ${item}`).join('\n\n');

const tightList = (items: string[]) => items.map(item => `- ${item}`).join('\n');

const printCode = (value: unknown): string =>
  Array.isArray(value)
    ? `[${value.map(printCode).join(', ')}]`
    : typeof value === 'function'
      ? value.toString()
      : JSON.stringify(value).replace(/([,:])/g, '$1 ');

for await (const dir of directories) {
  if (dir.isDirectory() && !dir.name.startsWith('_')) {
    const pluginName = dir.name;
    const pluginDir = path.join(pluginsDir, pluginName);
    const mod = await import(pathToFileURL(path.join(pluginDir, 'index.ts')).href);
    const plugin: Plugin = mod.default;
    const docs: undefined | { note: string; entry?: string[]; production?: string[] } = mod.docs;

    const { title, enablers, args, config, entry, production, project } = plugin;

    plugins.push([title, pluginName]);

    const description = `How Knip's ${title} plugin detects entry files, config files and dependencies.`;
    const frontmatter = `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(description)}\nsidebar:\n  hidden: true\n---`;

    const defaults: Record<string, string[]> = {};
    const configFiles = typeof config === 'function' ? config({ cwd: pluginDir }) : config;
    if (configFiles && configFiles.length > 0) defaults.config = configFiles;
    if (entry && entry.length > 0) defaults.entry = entry;
    if (docs?.entry && docs.entry.length > 0) defaults.entry = [...(defaults.entry ?? []), ...docs.entry];
    if (production && production.length > 0) defaults.entry = [...(defaults.entry ?? []), ...production];
    if (docs?.production && docs.production.length > 0)
      defaults.entry = [...(defaults.entry ?? []), ...docs.production];
    if (project && project.length > 0) defaults.project = project;

    const hasDefaultConfig = Object.values(defaults).some(v => v.length > 0);

    const enabledBlocks: string[] = [];
    if (Array.isArray(enablers) && enablers.length > 0) {
      if (enablers.length === 1 && typeof enablers[0] === 'string') {
        enabledBlocks.push(
          `This plugin is enabled if \`"${enablers[0]}"\` is listed in \`"dependencies"\` or \`"devDependencies"\` in \`package.json\`.`
        );
      } else {
        enabledBlocks.push(
          `This plugin is enabled if there's a match in \`"dependencies"\` or \`"devDependencies"\` in \`package.json\`:`
        );
        enabledBlocks.push(
          looseList(enablers.map(enabler => `\`${typeof enabler === 'string' ? enabler : enabler.source}\``))
        );
      }
    } else if (typeof enablers === 'string') {
      enabledBlocks.push(enablers);
    } else {
      enabledBlocks.push('This plugin is always enabled.');
    }

    const defaultConfigBlocks: string[] = hasDefaultConfig
      ? [
          '## Default configuration',
          'If this plugin is enabled, the following configuration is added automatically:',
          codeBlock(JSON.stringify({ [pluginName]: defaults }, null, 2), 'json'),
          'Depending on local configuration, plugins may modify the defaults as shown.',
          'Custom `config` or `entry` options override default values, they are not merged.',
          'See [Plugins](../../explanations/plugins.md) for more details about plugins and their `entry` and `config` options.',
        ]
      : [];

    const notesBlocks: string[] = docs?.note ? ['## Note', docs.note] : [];

    const argsBlocks: string[] = args
      ? [
          '## Shell commands',
          `This plugin adds argument parsing for the <code>${
            args.binaries ? args.binaries.join(' and ') : pluginName
          }</code>\n${args.binaries && args.binaries.length > 1 ? 'binaries' : 'binary'}. Configuration:`,
          codeBlock(
            Object.entries(args)
              .filter(([key]) => key !== 'binaries')
              .map(([key, value]) => `${key}: ${printCode(value)}`)
              .join('\n')
          ),
          'The configuration was generated from source code. Also see [Script Parser](../../features/script-parser.md).',
        ]
      : [];

    const generatedBlocks = [
      '## Generated from source',
      `This page was generated from the [${pluginName} plugin source code](${srcBaseUrl}/${dir.name}/index.ts).`,
    ];

    const output =
      [
        frontmatter,
        '## Enabled',
        ...enabledBlocks,
        ...defaultConfigBlocks,
        ...notesBlocks,
        ...argsBlocks,
        ...generatedBlocks,
      ].join('\n\n') + '\n';

    console.log(`Writing ${pluginName} docs to plugins/${pluginName}.md`);
    await fs.writeFile(path.join(referenceDocsDir, `plugins/${pluginName}.md`), output);
  }
}

plugins.sort((a, b) => (a[1] < b[1] ? -1 : 1));

const listDescription =
  'The full list of Knip plugins for frameworks, build tools, test runners and linters, each linking to its reference page.';

const indexFrontmatter = `---\ntitle: Plugins (${plugins.length})\ndescription: ${JSON.stringify(listDescription)}\ntableOfContents: false\n---`;

const indexBody = [
  ':::section{.columns.min200}',
  tightList(plugins.map(([title, name]) => `[${title}](/reference/plugins/${name})`)),
  ':::',
].join('\n\n');

const indexOutput = `${indexFrontmatter}\n\n${indexBody}\n`;

console.log('Writing plugin list to plugins.md');
await fs.writeFile(path.join(referenceDocsDir, 'plugins.md'), indexOutput);
