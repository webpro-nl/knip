# Plugins

## General

Read [Writing A Plugin][1] first to understand:

- Plugin responsibilities
- Functions like `resolveConfig` and `Input` type definition
- Consider `resolveFromAST` only for custom plugin-specific needs (core takes
  care of module resolution, imports, exports, external dependencies)

## Creating a new plugin

To create a new plugin for a certain package/tool/framework:

- Come up with a kebab-cased `name`.
- Run `pnpm create-plugin --name [name]` from the `packages/knip` directory.
- Update the plugin's `types.ts`: add only relevant types, remove if unused.
- Consult similar plugins and the tool's website before implementation
- Update and fill out the blanks in the generated files.
- Remove unused variables and empty arrays from the template
- Don't forget: [run tests][2] individually first.

[1]: ../packages/docs/src/content/docs/writing-a-plugin/index.md
[2]: ../AGENTS.md#test
