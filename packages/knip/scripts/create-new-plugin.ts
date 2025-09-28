import fs from 'node:fs/promises';
// biome-ignore lint: style/noRestrictedImports
import path from 'node:path';
import { parseArgs } from 'node:util';

const {
  values: { name, force = false, graceful = !force },
} = parseArgs({
  options: {
    name: { type: 'string' },
    force: { type: 'boolean' },
    graceful: { type: 'boolean' },
  },
});

const errorOnExist = force ? false : !graceful;

if (!name) {
  console.error('Usage: npm run create-plugin -- --name [name]');
  process.exit(1);
}

if (!/[a-z][a-z0-9_-]+/.test(name)) {
  console.error('Name must contain only lowercased letters, dashes and underscores (you can adjust the title later)');
  process.exit(1);
}

const cwd = process.cwd();
const pluginsDir = path.join(cwd, 'src/plugins');
const templateDir = path.join(pluginsDir, '_template');
const newPluginDir = path.join(pluginsDir, name);
const newPluginFile = path.join(newPluginDir, 'index.ts');
const schemaFilePath = path.join(cwd, 'schema.json');
const pluginTestsDir = path.join(cwd, 'test/plugins');
const pluginSchemaPath = path.join(cwd, 'src/schema/plugins.ts');
const pluginTestTemplateFilePath = path.join(pluginTestsDir, '_template.test.ts');
const pluginTestFilePath = path.join(pluginTestsDir, `${name}.test.ts`);
const pluginTestFixturesDir = path.join(cwd, 'fixtures/plugins');
const pluginTestFixtureTemplateDir = path.join(pluginTestFixturesDir, '_template');
const pluginTestFixturePluginDir = path.join(pluginTestFixturesDir, name);
const pluginTestFixtureManifest = path.join(pluginTestFixturePluginDir, 'package.json');

const relative = (to: string) => path.relative(cwd, to);

// Copy plugin implementation
await fs.cp(templateDir, newPluginDir, {
  recursive: true,
  errorOnExist,
  force,
});

// Add plugin to Zod validator
const validatorContent = String(await fs.readFile(pluginSchemaPath));
const pluginsPrefix = 'const pluginsSchema = z.object({';
const pluginsReplacement = `${pluginsPrefix}\n'${name}': pluginSchema,`;
await fs.writeFile(pluginSchemaPath, validatorContent.replace(pluginsPrefix, pluginsReplacement));

// Copy fixtures
await fs.cp(pluginTestFixtureTemplateDir, pluginTestFixturePluginDir, {
  recursive: true,
  errorOnExist,
  force,
});

// Copy test file
await fs.cp(pluginTestTemplateFilePath, pluginTestFilePath, {
  errorOnExist,
  force,
});

// String replacements
for (const filePath of [newPluginFile, pluginTestFilePath, pluginTestFixtureManifest]) {
  if (await fs.exists(filePath)) {
    const content = String(await fs.readFile(filePath));
    await fs.writeFile(filePath, content.replaceAll('_template', name).replaceAll('__PLUGIN_NAME__', name));
  }
}

// Add plugin to JSON Schema
const { default: schema } = await import(schemaFilePath);
const { plugins } = schema.definitions;
const { properties } = plugins;

properties[name] = {
  title: `${name} plugin configuration (https://knip.dev/reference/plugins/${name})`,
  $ref: '#/definitions/plugin',
};

plugins.properties = Object.keys(properties)
  .sort()
  // biome-ignore lint: performance/noAccumulatingSpread
  .reduce((props, key) => ({ ...props, [key]: properties[key] }), {});

await fs.writeFile(schemaFilePath, JSON.stringify(schema, null, 2));

console.log(`✔️  Created new plugin in ${relative(newPluginDir)}`);
console.log(`✔️  Created a test file at ${relative(pluginTestFilePath)}`);
console.log(`✔️  Added plugin to ${relative(schemaFilePath)}`);
console.log('');
console.log('Documentation: https://knip.dev/guides/writing-a-plugin');
