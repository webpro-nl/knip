# Knip Configuration Examples

## Single Project (zero-config)

Most single projects need no configuration. Knip auto-detects entry points from `package.json#main`, `package.json#exports`, and built-in plugins (TypeScript, ESLint, Vitest, etc.).

To override:

```json
{
  "$schema": "https://unpkg.com/knip@latest/schema.json",
  "entry": ["src/index.ts", "src/cli.ts"],
  "ignore": ["**/generated/**"]
}
```

## Next.js Project

```json
{
  "$schema": "https://unpkg.com/knip@latest/schema.json",
  "entry": [
    "app/**/*.{ts,tsx}",
    "pages/**/*.{ts,tsx}",
    "middleware.ts",
    "instrumentation.ts"
  ],
  "ignoreDependencies": [
    "@next/font"
  ]
}
```

## Monorepo

```json
{
  "$schema": "https://unpkg.com/knip@latest/schema.json",

  "ignoreBinaries": [
    "prisma"
  ],

  "workspaces": {
    ".": {
      "entry": ["scripts/**/*.ts"],
      "ignore": [".worktrees/**"]
    },

    "apps/web": {
      "entry": [
        "src/pages/**/*.{ts,tsx}",
        "src/components/**/*.{astro,tsx}"
      ]
    },

    "apps/api": {
      "entry": [
        "src/index.ts",
        "src/routes/**/*.ts"
      ],
      "ignoreDependencies": [
        "drizzle-kit"
      ]
    },

    "apps/mobile": {
      "entry": [
        "app/**/*.{ts,tsx}",
        "src/services/**/*.ts"
      ],
      "ignoreDependencies": [
        "expo-dev-client",
        "expo-build-properties",
        "expo-splash-screen"
      ],
      "ignore": [
        "targets/**",
        "patches/**"
      ]
    },

    "packages/*": {
      "entry": ["src/index.ts"]
    },

    "tools/*": {
      "entry": ["src/index.ts"]
    }
  }
}
```

## Expo / React Native

```json
{
  "$schema": "https://unpkg.com/knip@latest/schema.json",
  "entry": [
    "app/**/*.{ts,tsx}",
    "src/services/**/*.ts",
    "modules/**/index.ts"
  ],
  "ignoreDependencies": [
    "expo-dev-client",
    "expo-build-properties",
    "expo-font",
    "expo-splash-screen",
    "expo-system-ui",
    "@react-native/babel-preset"
  ],
  "ignore": [
    "targets/**",
    "patches/**"
  ]
}
```

## Notes

- **`$schema`** — enables autocomplete and validation in editors.
- **`ignoreDependencies`** — for packages used at runtime but not statically imported (native modules, polyfills, framework plugins auto-loaded at build time).
- **`ignoreBinaries`** — for CLI tools invoked in npm scripts but never imported in source code.
- **`ignore`** — for directories or files that are not JS/TS source (native code, patch files, generated output).
- **`entry`** — for files that serve as entry points but are not discoverable by Knip's default heuristics or plugins.

## Extending

To add a new workspace-specific override in a monorepo, add a key matching the workspace path:

```json
{
  "workspaces": {
    "tools/my-tool": {
      "entry": ["src/index.ts", "src/commands/**/*.ts"],
      "ignoreDependencies": ["some-cli-dep"]
    }
  }
}
```

To ignore a dependency globally (across all workspaces), add it to the top-level `ignoreDependencies` array.
