---
title: Integrations
---

- [VS Code/VSX Extension][1]
- [JetBrains Plugin][2]
- [MCP Server][3]
- [Language Server][4]

## VS Code Extension

The official VS Code extension provides a rich integration with the [Knip
Language Server][4]:

- **Diagnostics**: Inline warnings for unused dependencies, exports and files
- **Hover Information**: Hover over exports to see import and usage locations
- **Imports Tree View**: Direct links to implementations
- **Exports Tree View**: Direct links to import and usage locations
- **Contention Detection**: Warnings for circular dependencies, conflicts and
  branched import chains
- **Built-in MCP Server**: Automated configuration support for coding agents

Find [Knip on the VS Code Marketplace][5] and find [Knip in the Open VSX
Registry][6].

See below for [screenshots][7].

## JetBrains Plugin

A community plugin is available for JetBrains IDEs including WebStorm, IntelliJ
IDEA, and others. The plugin is powered by the [Knip Language Server][4] and
provides diagnostics. Find [Knip on the JetBrains Marketplace][8].

## MCP Server

The standalone MCP Server enables coding agents to configure Knip automatically.
Tell your agent to "configure knip" and it will use the available tools to
create, analyze and optimize your `knip.json` configuration.

The [Knip MCP Server][9] is available separately and built into the [Knip VS
Code Extension][1].

Start:

```sh
npx @knip/mcp
```

Note: The VS Code extension has this MCP Server built-in.

## Language Server

The IDE integrations are powered by the Knip Language Server. It builds the full
module graph of your project and provides a session with a graph explorer. See
the [Knip Language Server documentation][10] for more details and information on
integrating Knip.

## VS Code Extension Screenshots

### Lint Findings

![Lint Findings][11]

### Imports & Exports

![Hover over imports and exports][12]

### Contention

The IDE extension shows extra issues in the tree views like circular
dependencies.

#### Circular Dependencies

![Circular Dependencies][13]

#### Conflicts

![Conflicts][14]

#### Branching

![Branching][15]

### Settings

![VS Code Extension Settings][16]

[1]: #vs-code-extension
[2]: #jetbrains-plugin
[3]: #mcp-server
[4]: #language-server
[5]: https://marketplace.visualstudio.com/items?itemName=webpro.vscode-knip
[6]: https://open-vsx.org/extension/webpro/vscode-knip
[7]: #vs-code-extension-screenshots
[8]: https://plugins.jetbrains.com/plugin/29765-knip
[9]: https://www.npmjs.com/package/@knip/mcp
[10]:
  https://github.com/webpro-nl/knip/blob/main/packages/language-server/README.md
[11]: /screenshots/editors-and-agents/diagnostics.webp
[12]: /screenshots/editors-and-agents/imports-exports.webp
[13]: /screenshots/editors-and-agents/circular-dependency.webp
[14]: /screenshots/editors-and-agents/conflict.webp
[15]: /screenshots/editors-and-agents/branch.webp
[16]: /screenshots/editors-and-agents/vscode-extension-settings.webp
