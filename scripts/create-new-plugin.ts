import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';

const {
  values: { name },
} = parseArgs({
  options: {
    name: { type: 'string' },
  },
});

if (!name) {
  console.error('Usage: npm run create-plugin -- --name [name]');
  process.exit(1);
}

if (/[^a-z]/.test(name)) {
  console.error('Name must contain only lowercased letters (you can adjust the plugin title later)');
  process.exit(1);
}

const cwd = process.cwd();
const pluginsDir = path.join(cwd, 'src/plugins');
const templateDir = path.join(pluginsDir, '_template');
const newPluginDir = path.join(pluginsDir, name);
const pluginsBarrelFilePath = path.join(pluginsDir, 'index.ts');
const schemaFilePath = path.join(cwd, 'schema.json');

const rel = p => path.relative(cwd, p);

await fs.cp(templateDir, newPluginDir, {
  recursive: true,
  errorOnExist: true,
  force: false,
});

await fs.writeFile(
  pluginsBarrelFilePath,
  String(await fs.readFile(pluginsBarrelFilePath)) + `export * as ${name} from './${name}/index.js';`
);

const { default: schema } = await import(schemaFilePath);
const { plugins } = schema.definitions;
const { properties } = plugins;

properties[name] = {
  title: `${name} plugin configuration (https://github.com/webpro/knip/blob/next/src/plugins/${name}/README.md)`,
  $ref: '#/definitions/plugin',
};

plugins.properties = Object.keys(properties)
  .sort()
  .reduce((props, key) => ({ ...props, [key]: properties[key] }), {});

await fs.writeFile(schemaFilePath, JSON.stringify(schema, null, 2));

console.log(`Created new plugin at ${rel(newPluginDir)}`);
console.log(`Updated ${rel(newPluginDir)} and ${rel(schemaFilePath)}, please review the changes`);
console.log('Please populate index.ts with configuration and implementation (see the other plugins for inspiration!)');
console.log('The README.md can then be generated using `npm run docs:plugins`');
