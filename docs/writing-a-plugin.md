# Writing a Plugin

In this guide we are going to write a new plugin for Knip. We'll be using "Cool Linter" as our example tool we create
the plugin for. You can also follow along to create a new plugin directly.

This document also serves as a reference to each of the exported values.

If you want to know [how to use or configure plugins][1], the front page has you covered.

## Contents

- [Scaffold a new plugin][2]
- [Exports][3]
  - [`NAME`][4]
  - [`ENABLERS`][5]
  - [`isEnabled`][6]
  - [`CONFIG_FILE_PATTERNS`][7]
  - [`findDependencies`][8]
  - [`ENTRY_FILE_PATTERNS`][9]
  - [`PRODUCTION_ENTRY_FILE_PATTERNS`][10]
  - [`PROJECT_FILE_PATTERNS`][11]
- [Tests][12]
- [Documentation][13]

## Scaffold a new plugin

The easiest way to ceate a new plugin is to run this command:

```sh
npm run create-plugin -- --name cool-linter
```

It will add source files, and a test and fixtures to get you started.

## Exports

The rest of this document describes each exported value that the generator has pre-defined at
[src/plugins/cool-linter/index.ts][14]. Writing a plugin is much like filling in the blanks. Everything that is not used
or empty can be removed.

### `NAME`

The name of the plugin to display in the [docs][15] and debug output (ie. when running `knip --debug`).

```ts
export const NAME = 'Cool Linter';
```

### `ENABLERS`

An array of strings and/or regular expressions that should match one or more dependencies so the `isEnabled` function
can determine whether the plugin should be enabled or not. This is often a single package name, for example:

```ts
export const ENABLERS = ['cool-linter'];
```

### `isEnabled`

This function can be fairly straightforward with the `hasDependency` helper:

```ts
export const isEnabled = ({ dependencies }) => hasDependency(dependencies, ENABLERS);
```

This will check whether a match is found in the `dependencies` or `devDependencies` in `package.json`. When the
`cool-linter` dependency is listed in `package.json`, the plugin will be enabled.

#### Note

In some occasions you might want to check for something else, such as the presence of a file. You can implement any
(`async`) function and return a boolean. Here is the full [function signature for `IsPluginEnabledCallback`][16].

### `CONFIG_FILE_PATTERNS`

**IMPORTANT**: You only need `CONFIG_FILE_PATTERNS` and implement the `findDependencies` function if at least one of the
configuration files is JSON or YAML, or if the configuration references dependencies **not** using regular `require` or
`import` statements.

In other words, you only need it for configurations like `extends: ['eslint-config-airbnb']`. Otherwise, you can skip to
[`ENTRY_FILE_PATTERNS`][9].

With that out of the way, here's an example for Cool Linter:

```ts
export const CONFIG_FILE_PATTERNS = ['cool-linter.config.{js,json}'];
```

For each configuration file with a match in `CONFIG_FILE_PATTERNS`, the `findDependencies` function will be invoked with
the file path as the first argument.

#### Note

Configuration files are sometimes `.js` or `.ts` files such as `cool-linter.config.js`. The **exported configuration**
will be handled by `findDependencies`, but these files may also **require/import** dependencies. That's why they're
automatically added to [`ENTRY_FILE_PATTERNS`][9].

### `findDependencies`

The `findDependencies` function should do three things:

1.  Load and execute the provided configuration file.
2.  Find dependencies referenced in this configuration.
3.  Return an array of the dependencies.

For example, you are using Cool Linter in your project, and running Knip results in some false positives:

    Unused dependencies (2)
    @cool-linter/awesome-addon
    @cool-linter/priority-plugin

This is incorrect, since you have `cool-linter.config.json` that references those dependencies!

```json
{
  "addons": ["@cool-linter/awesome-addon"],
  "plugins": ["@cool-linter/priority-plugin"]
}
```

What can we do to get rid of those "unused dependencies"? This is where the new Cool Linter plugin comes in. Knip will
look for `cool-linter.config.json`, and the exported `findDependencies` function will be invoked with the full path to
the file.

```ts
const findCoolLinterDependencies: GenericPluginCallback = async configFilePath => {
  // 1. Load the configuration
  const config = await load(configFilePath);

  // 2. Grab the dependencies from the object
  const addons = config?.addons ?? [];
  const plugins = config?.plugins ?? [];

  // 3. Return the results
  return [...addons, ...plugins];
};

export const findDependencies = timerify(findCoolLinterDependencies);
```

### Notes

- Knip provides the `load` helper to load most JavaScript, TypeScript, JSON and YAML files.
- When wrapping the function with `timerify`, some statistics about calls will be available when telling Knip to output
  some performance data (ie. `knip --performance`).

### `ENTRY_FILE_PATTERNS`

Entry files are added to the Knip analysis, just like other `entry` files in the source code. This means that their
imports and exports will be resolved, recursively. Plugins include various types of entry files:

- Plugins related to test frameworks should include files such as `*.spec.js`.
- Plugins for frameworks such as Next.js or Svelte should include files like `pages/**/*.ts` or `routes/**/*.svelte`.
- Another example is Storybook that includes entry files like `**/*.stories.js`.
- The Next.js plugin does not need `CONFIG_FILE_PATTERNS` with `findPluginDependencies`. Yet it does have
  `next.config.{js,ts}` in `ENTRY_FILE_PATTERNS`, since that file may import all kinds of dependencies.

Cool Linter does not require such files, so we can remove them from our plugin.

#### Note

Knip's default patterns for test files probably cover enough for most test related tools, these don't need to be added
in the plugin anymore:

- `**/*.{test,spec}.{js,jsx,ts,tsx,mjs,cjs}`
- `**/__tests__/**/*.{js,jsx,ts,tsx,mjs,cjs}`
- `**/test/**/*.{js,jsx,ts,tsx,mjs,cjs}`

### `PRODUCTION_ENTRY_FILE_PATTERNS`

Most files targeted by plugins are files related to test and development (such as test and configuration files), and
usually they depend on `devDependencies`. However, some plugins target production files, such as Gatsby and Remix.
Here's an example from the latter:

```ts
export const PRODUCTION_ENTRY_FILE_PATTERNS = [
  'app/root.tsx',
  'app/entry.{client,server}.{js,jsx,ts,tsx}',
  'app/routes/**/*.{js,ts,tsx}',
  'server.{js,ts}',
];
```

When running the [production mode][17] of Knip, these files are included in the analysis. They're also included in the
default mode.

Cool Linter does not require such files, so we can remove them from our plugin.

### `PROJECT_FILE_PATTERNS`

You rarely need this. Sometimes the files targeted with `project` patterns may not include the files related to the tool
of the plugin. For instance, Storybook files are in a `.storybook` directory, which may not be found by the default glob
patterns. So here they can be explicitly added, regardless of the user's global `project` files configuration.

```ts
export const PROJECT_FILE_PATTERNS = ['.storybook/**/*.{js,jsx,ts,tsx}'];
```

Cool Linter does not require such files, so we can remove them from our plugin.

## Tests

Let's update the tests to verify our plugin implementation is working correctly.

1.  Let's save the example `cool-linter.config.json` in the fixtures directory. Create the file in your IDE, or use this
    command to do it in one go from the comand-line:

```sh
echo '{"addons": ["@cool-linter/awesome-addon"],"plugins": ["@cool-linter/priority-plugin"]}' > tests/fixtures/plugins cool-linter/cool-linter.config.json
```

2.  Update the test at [tests/plugins/cool-linter.test.ts][18] with the right inputs and outputs:

```ts
test('Find dependencies in cool-linter configuration (json)', async () => {
  const configFilePath = join(cwd, 'cool-linter.config.json');
  const dependencies = await coolLinter.findDependencies(configFilePath);
  assert.deepEqual(dependencies, ['@cool-linter/awesome-addon', '@cool-linter/priority-plugin']);
});
```

This verifies the dependencies in `cool-linter.config.json` are correctly returned to the Knip program.

3.  Run the test:

```sh
npx tsx tests/plugins/cool-linter.test.ts
```

## Documentation

The `README.md` file for each plugin is generated by running this npm script:

```sh
npm run docs
```

This command also formats the generated Markdown files, and updates the [list of plugins in the docs][1].

## Wrapping Up

First of all, thanks for reading this far. If you have been following this guide to create a new plugin, this might be
the right time to open a pull request!

[![An orange cow with scissors, Van Gogh style][20]][19] <sup>_“An orange cow with scissors, Van Gogh style” - generated
with OpenAI_</sup>

[1]: ../README.md#plugins
[2]: #scaffold-a-new-plugin
[3]: #exports
[4]: #name
[5]: #enablers
[6]: #isenabled
[7]: #config_file_patterns
[8]: #finddependencies
[9]: #entry_file_patterns
[10]: #production_entry_file_patterns
[11]: #project_file_patterns
[12]: #tests
[13]: #documentation
[14]: ../src/plugins/cool-linter/index.ts
[15]: ../README.md
[16]: ../src/types//plugins.ts
[17]: ../README.md#production-mode
[18]: ../tests/plugins/cool-linter.test.ts
[19]: https://labs.openai.com/s/xZQACaLepaKya0PRUPtIN5dC
[20]: ../assets/cow-with-orange-scissors-van-gogh-style.webp
