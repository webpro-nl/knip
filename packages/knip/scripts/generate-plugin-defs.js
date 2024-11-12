import fs from 'node:fs';
import { EOL } from 'node:os';
// biome-ignore lint/nursery/noRestrictedImports: script
import path from 'node:path';

const HEADER = '// This file is generated (no need to edit)';
const cc = str => str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_m, char) => char.toUpperCase());

const pluginsDir = path.resolve('src/plugins');
const outputFileTypes = path.resolve('src/types/PluginNames.ts');
const outputFilePlugins = path.resolve('src/plugins/index.ts');
const outputFileSchema = path.resolve('src/schema/plugins.ts');

const pluginNames = fs
  .readdirSync(pluginsDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('_'))
  .map(dirent => dirent.name)
  .sort();

const typeDefinition = `export type PluginName = ${pluginNames.map(name => `'${name}'`).join(' | ')};`;

const values = `export const pluginNames = [${pluginNames.map(name => `'${name}'`).join(',')}] as const;`;

fs.writeFileSync(outputFileTypes, HEADER + EOL + typeDefinition + EOL + EOL + values);

const imports = pluginNames.map(name => `import { default as ${cc(name)} } from './${name}/index.js';`).join(EOL);
const pluginsObj = `export const Plugins = {${pluginNames
  .map(name => (name === cc(name) ? `${name},` : `'${name}': ${cc(name)},`))
  .join(EOL)} };`;

fs.writeFileSync(outputFilePlugins, HEADER + EOL + imports + EOL + EOL + pluginsObj);

const pluginSchemas = pluginNames.map(name => `'${name}': pluginSchema`).join(`,${EOL}`);
const pluginSchema = `import { z } from 'zod';
export const globSchema = z.union([z.string(), z.array(z.string())]);

export const pluginSchema = z.union([
  z.boolean(),
  globSchema,
  z.object({
    config: globSchema.optional(),
    entry: globSchema.optional(),
    project: globSchema.optional(),
  }),
]);

export const pluginsSchema = z.object({${pluginSchemas}});`;

fs.writeFileSync(outputFileSchema, HEADER + EOL + pluginSchema);
