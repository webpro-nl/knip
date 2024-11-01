import fs from 'node:fs/promises';
// biome-ignore lint/nursery/noRestrictedImports: script
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Table from 'easy-table';
import type { Plugin } from '../src/types/config.js';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const knipDir = path.join(rootDir, '../../packages/knip');
const pluginsDir = path.join(knipDir, 'src/plugins');
const directories = await fs.opendir(pluginsDir);

const data = [];

for await (const dir of directories) {
  if (dir.isDirectory() && !dir.name.startsWith('_')) {
    const pluginName = dir.name;
    const pluginDir = path.join(pluginsDir, pluginName);
    const plugin: Plugin = (await import(path.join(pluginDir, 'index.ts'))).default;

    data.push({
      title: plugin.title,
      config: plugin.config?.length > 0 ? 1 : 0,
      entry: plugin.entry?.length > 0 ? 1 : 0,
      production: plugin.production?.length > 0 ? 1 : 0,
      resolve: plugin.resolve ? 1 : 0,
      resolveConfig: plugin.resolveConfig ? 1 : 0,
      resolveEntryPaths: plugin.resolveEntryPaths ? 1 : 0,
      n: 1,
    });
  }
}

const t = new Table();

for (const plugin of data) {
  t.cell('Plugin', plugin.title);
  t.cell('config', plugin.config, Table.number(0));
  t.cell('entry', plugin.entry, Table.number(0));
  t.cell('production', plugin.production, Table.number(0));
  t.cell('resolve', plugin.resolve, Table.number(0));
  t.cell('resolveEntryPaths', plugin.resolveEntryPaths, Table.number(0));
  t.cell('resolveConfig', plugin.resolveConfig, Table.number(0));
  t.cell('n', plugin.n, Table.number(0));
  t.newRow();
}

t.sort(['Plugin']);

t.total('config');
t.total('entry');
t.total('production');
t.total('resolve');
t.total('resolveEntryPaths');
t.total('resolveConfig');
t.total('n');

console.log(t.toString());
