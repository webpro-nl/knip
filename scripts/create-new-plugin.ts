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

if (/[^a-z_-]/.test(name)) {
  console.error('Name must contain only lowercased letters, dashes and underscores (you can adjust the title later)');
  process.exit(1);
}

const cwd = process.cwd();
const pluginsDir = path.join(cwd, 'src/plugins');
const templateDir = path.join(pluginsDir, '_template');
const newPluginDir = path.join(pluginsDir, name);
const pluginsBarrelFilePath = path.join(pluginsDir, 'index.ts');
const schemaFilePath = path.join(cwd, 'schema.json');
const pluginTestsDir = path.join(cwd, 'test/tests/plugins');
const pluginTestTemplateFilePath = path.join(pluginTestsDir, '_template.test.ts');
const pluginTestFilePath = path.join(pluginTestsDir, `${name}.test.ts`);
const pluginTestFixturesDir = path.join(cwd, 'test/fixtures/plugins');
const pluginTestFixtureTemplateDir = path.join(pluginTestFixturesDir, '_template');
const pluginTestFixturePluginDir = path.join(pluginTestFixturesDir, name);
const camelCasedName = name.toLowerCase().replace(/(-[a-z])/g, group => group.toUpperCase().replace('-', ''));

const relative = to => path.relative(cwd, to);

await fs.cp(templateDir, newPluginDir, {
  recursive: true,
  errorOnExist: true,
  force: false,
});

await fs.writeFile(
  pluginsBarrelFilePath,
  String(await fs.readFile(pluginsBarrelFilePath)) + `export * as ${camelCasedName} from './${name}/index.js';`
);

await fs.cp(pluginTestFixtureTemplateDir, pluginTestFixturePluginDir, {
  recursive: true,
  errorOnExist: true,
  force: false,
});

await fs.copyFile(pluginTestTemplateFilePath, pluginTestFilePath);

const { default: schema } = await import(schemaFilePath);
const { plugins } = schema.definitions;
const { properties } = plugins;

properties[name] = {
  title: `${name} plugin configuration (https://github.com/webpro/knip/blob/main/src/plugins/${name}/README.md)`,
  $ref: '#/definitions/plugin',
};

plugins.properties = Object.keys(properties)
  .sort()
  .reduce((props, key) => ({ ...props, [key]: properties[key] }), {});

await fs.writeFile(schemaFilePath, JSON.stringify(schema, null, 2));

console.log(`Created new plugin at ${relative(newPluginDir)}`);
console.log(`Updated ${relative(pluginsBarrelFilePath)} and ${relative(schemaFilePath)}, please review the changes`);
console.log(`Created a test file at ${relative(pluginTestFilePath)}`);
console.log('Please review the changes, populate index.ts with config and implementation, and update the test(s)');
console.log('See the other plugins for inspiration! The README.md can then be generated using `npm run docs:plugins`');
