# Mini Program Plugin

A plugin for analyzing dependencies in WeChat Mini Program projects.

## Overview

The plugin analyzes dependencies in WeChat Mini Program projects, supporting both regular Mini Program projects and plugin projects. It handles various file types including JavaScript/TypeScript, WXML templates, WXSS styles, WXS modules, and JSON configurations.

## Requirements and Activation

- Requires `miniprogram-api-typings` in dependencies/devDependencies
- Activates when either:
  - `app.json` exists with a valid `pages` array (Mini Program project)
  - `plugin.json` exists (Mini Program plugin project)

## Project Structure

### Entry Points

The plugin automatically selects the appropriate entry point based on project type:

- `app.json` - Main configuration for Mini Program projects
- `plugin.json` - Main configuration for plugin projects
- `sitemap.json` - Optional configuration for WeChat search crawling (marked as used but not analyzed)

### File Types and Dependencies

#### JSON Files

1. **app.json**
   - Pages via `pages` array
   - Components via `usingComponents`
   - Subpackages via `subPackages`
   - Workers via `workers`
   - Tab bar icons via `tabBar.list[].iconPath`

   Example:

   ```json
   {
     "pages": ["pages/index/index"],
     "subPackages": [{
       "root": "packages/feature",
       "pages": ["pages/index/index"]
     }],
     "usingComponents": {
       "custom-comp": "/components/custom/custom"
     },
     "workers": "workers",
     "tabBar": {
       "list": [{
         "iconPath": "images/icon.png",
         "selectedIconPath": "images/icon-selected.png"
       }]
     }
   }
   ```

2. **Component/Page JSON**

   ```json
   {
     "component": true,
     "usingComponents": {
       "custom-comp": "/components/custom/custom",
       "other-comp": "../../components/other/index"
     }
   }
   ```

3. **plugin.json** (for plugin projects)

   ```json
   {
     "publicComponents": {
       "custom-component": "components/custom/custom"
     },
     "pages": {
       "hello-page": "pages/hello/hello"
     },
     "main": "index.js"
   }
   ```

#### Template Files (WXML)

1. **Template Imports/Includes**

   ```html
   <!-- Importing templates -->
   <import src="template.wxml"/>
   <template is="item" data="{{text: 'hello'}}"/>

   <!-- Including content -->
   <include src="/templates/header.wxml" />
   ```

2. **Resources**

   ```html
   <!-- Images -->
   <image src="/images/logo.png" />

   <!-- WXS Modules -->
   <wxs src="/utils/format.wxs" module="format" />
   ```

#### Style Files (WXSS)

```css
@import "/styles/common.wxss";
```

#### Script Files (WXS)

```js
var utils = require('/utils/common.wxs');
```

#### Worker Files

```js
const worker = wx.createWorker('workers/request.js')
```

## Configuration

Configure the plugin in your Knip configuration:

```json
{
  "miniprogram": {
    // Entry files to analyze (overrides default entry points)
    "entry": ["src/app.json", "src/plugin.json"],

    // Production files to include (in addition to default patterns)
    "project": [
      "src/custom/**/*.js",
      "src/vendors/**/*.js"
    ],

    // Files to ignore from analysis
    "ignore": [
      "src/components/debug/**/*",
      "src/**/*.test.js"
    ],

    // Custom root directory for absolute path resolution
    "root": "src/miniprogram"
  }
}
```

### Path Resolution

The plugin supports three types of paths:

1. **Alias Paths** (via Knip's global paths)

   ```json
   {
     "paths": {
       "@components": ["src/components"],
       "@utils": ["src/utils"],
       "~": ["src"]
     }
   }
   ```

2. **Absolute Paths** (via miniprogram.root)
3. **Relative Paths** (relative to current file)

Example usage in component configuration:

```json
{
  "usingComponents": {
    "comp1": "@components/shared/foo",  // Alias path
    "comp2": "/components/baz",         // Absolute path
    "comp3": "../components/other"      // Relative path
  }
}
```

## Best Practices

1. **Component Organization**
   - Keep component dependencies in the same directory
   - Use explicit paths in component references
   - Avoid dynamic component loading

2. **Template Usage**
   - Place shared templates in a dedicated directory
   - Use static template names over dynamic `is` attributes
   - Understand import vs include:
     - `import`: Template definitions only
     - `include`: Full content with shared scope

## Limitations

- No analysis of dynamic imports
- No tracking of runtime component registration
- Cannot detect dynamic template names
- Cannot analyze worker message patterns

## TypeScript Support

The plugin automatically handles TypeScript files, with `miniprogram-api-typings` required for all file types.
