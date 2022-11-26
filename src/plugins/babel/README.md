# Babel

## Enabled

This plugin is enabled when any of the following packages is in `dependencies` or `devDependencies`:

- @babel/cli
- @babel/core
- @babel/preset-env
- @babel/register

## Default configuration

```json
{
  "babel": {
    "config": ["babel.config.json", "babel.config.js", ".babelrc.json", ".babelrc.js", ".babelrc", "package.json"]
  }
}
```
