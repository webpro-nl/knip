# ESLint

## Enabled

This plugin is enabled when any of the following packages is in `dependencies` or `devDependencies`:

- eslint

## Default configuration

```json
{
  "eslint": {
    "config": [".eslintrc", ".eslintrc.json", ".eslintrc.js"],
    "entryFiles": ["eslint.config.js"],
    "sampleFiles": ["sample.js", "sample.ts"]
  }
}
```

Note that the `config` files represent the current way to configure ESLint, while `eslint.config.js` in `entryFiles`
represents the new way. The latter is more explicit and expects things like parsers and plugins to be referenced
directly, which requires such dependencies to be imported first. This means Knip can handle such configuration files as
regular source code entry files.

## Sample files

Due to the way ESLint configuration is set up, `sampleFiles` can be added for `overrides` configurations with otherwise
unused dependencies. It should contain file paths matching a `files` glob pattern of such an `overrides` configuration.
Let's take a look at an example ESLint configuration fragment:

```json
{
  "plugins": ["testing-library"],
  "overrides": [
    {
      "files": ["**/*.spec.tsx"],
      "extends": ["plugin:jest-dom/recommended", "plugin:testing-library/react"]
    }
  ]
}
```

The sample file should match a glob in the `files` like so:

```json
{
  "eslint": {
    "sampleFiles": ["lib/module.spec.tsx"]
  }
}
```

That's it. Now Knip can ask ESLint the configuration for `lib/module.spec.tsx`, which will resolve to the dependencies
listed in `extends`. These depencies will no longer be marked as "unused".
