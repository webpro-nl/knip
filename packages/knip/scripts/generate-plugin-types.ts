import fs from 'node:fs';
import { EOL } from 'node:os';
// biome-ignore lint/nursery/noRestrictedImports: script
import path from 'node:path';

const pluginsDir = path.resolve('src/plugins');
const outputFile = path.resolve('src/types/PluginNames.ts');

const pluginNames = fs
  .readdirSync(pluginsDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('_'))
  .map(dirent => dirent.name)
  .sort();

const typeDefinition = `export type PluginName = ${pluginNames.map(name => `'${name}'`).join(' | ')};`;

const values = `export const pluginNames = [${pluginNames.map(name => `'${name}'`).join(',')}] as const;`;

fs.writeFileSync(outputFile, typeDefinition + EOL + EOL + values);
