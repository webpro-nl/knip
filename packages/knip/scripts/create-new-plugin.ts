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

const toCamelCase = (name: string) =>
  name.toLowerCase().replace(/(-[a-z])/g, group => group.toUpperCase().replace('-', ''));

const cwd = process.cwd();
const pluginsDir = path.join(cwd, 'src/plugins');
const templateDir = path.join(pluginsDir, '_template');
const newPluginDir = path.join(pluginsDir, name);
const newPluginFile = path.join(newPluginDir, 'index.ts');
const pluginsBarrelFilePath = path.join(pluginsDir, 'index.ts');
const schemaFilePath = path.join(cwd, 'schema.json');
const pluginTestsDir = path.join(cwd, 'test/plugins');
const validatorFilePath = path.join(cwd, 'src/ConfigurationValidator.ts');
const pluginTestTemplateFilePath = path.join(pluginTestsDir, '_template.test.ts');
const pluginTestFilePath = path.join(pluginTestsDir, `${name}.test.ts`);
const pluginTestFixturesDir = path.join(cwd, 'fixtures/plugins');
const pluginTestFixtureTemplateDir = path.join(pluginTestFixturesDir, '_template');
const pluginTestFixturePluginDir = path.join(pluginTestFixturesDir, name);
const pluginTestFixtureManifest = path.join(pluginTestFixturePluginDir, 'package.json');
const camelCasedName = toCamelCase(name);

const relative = to => path.relative(cwd, to);

// Copy plugin implementation
await fs.cp(templateDir, newPluginDir, {
  recursive: true,
  errorOnExist: true,
  force: false,
});

// Add plugin to barrel file
const barrelFile = String(await fs.readFile(pluginsBarrelFilePath));
await fs.writeFile(
  pluginsBarrelFilePath,
  barrelFile + `export { default as ${camelCasedName} } from './${name}/index.js';`
);

// Add plugin to Zod validator
const validatorContent = String(await fs.readFile(validatorFilePath));
const pluginsPrefix = 'const pluginsSchema = z.object({';
const pluginsReplacement = `${pluginsPrefix}\n'${name}': pluginSchema,`;
await fs.writeFile(validatorFilePath, validatorContent.replace(pluginsPrefix, pluginsReplacement));

// Copy fixtures
await fs.cp(pluginTestFixtureTemplateDir, pluginTestFixturePluginDir, {
  recursive: true,
  errorOnExist: true,
  force: false,
});

// Copy test file
await fs.cp(pluginTestTemplateFilePath, pluginTestFilePath, {
  errorOnExist: true,
  force: false,
});

// String replacements
for (const filePath of [newPluginFile, pluginTestFilePath, pluginTestFixtureManifest]) {
  const content = String(await fs.readFile(filePath));
  await fs.writeFile(filePath, content.replaceAll('_template', camelCasedName).replaceAll('__PLUGIN_NAME__', name));
}

// Add plugin to JSON Schema
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

console.log(`✔️  Created new plugin in ${relative(newPluginDir)}`);
console.log(`✔️  Created a test file at ${relative(pluginTestFilePath)}`);
console.log(`✔️  Added plugin to ${relative(pluginsBarrelFilePath)} and ${relative(schemaFilePath)}`);
console.log('');
console.log('Documentation: https://knip.dev/guides/writing-a-plugin');
