---
title: Knip for Editors & Agents
date: 2025-12-17
sidebar:
  order: 1
---

_Published: 2025-12-17_

Three years in, Knip has founds its place in [over 10.000 projects][1] and is
downloaded [over 18M times/month][2]. A long period of steady growth in usage
and stability allows Knip to become more accessible to more people. That's why
I'm excited and proud to introduce the brand new VS Code Extension **and** MCP
Server. For humans and coding agents alike, Knip will help keep your codebases
tidy.

Don't forget... Knip it before you ship it!

## VS Code Extension

This one is for you.

[The usual suspects][3] like red squiggles for unused exports are there. What
really moves the needle for DX with Knip's module graph is **navigation**. A
completely unique way to view & fly through codebases for developers who care.
Connect the dots during development and refactors, while keeping things in
check. We're starting out with [3 key features][4]:

1. **Hover over Export** for import & usage locations
2. **Imports Tree View** for direct links to implementations
3. **Exports Tree View** for direct links to import & usage locations

Find [Knip on the VS Code Marketplace][5].

## MCP Server

Configuring Knip has always been a major headache to many. No more. Tell your
coding agent to "configure knip" and it will RTFM so you don't have to. Using a
newer model like Opus 4.5 or GPT 5.2 results in an optimized `knip.json` file
and an uncluttered codebase.

The [MCP Server is available][6] separately and built into the VS Code
Extension.

## Language Server

The VS Code Extension and the MCP Server are powered by the new Language Server.
It's a custom server that builds the full module graph of your project, and
provides a session with a graph explorer to request all sorts of interesting
information. Queries like "where is an export imported" or "is this import part
of a circular dependency" are just scratching the surface here.

Extensions for other IDEs can be built on top. See
[language-server/README.md][7]

## Screenshots

- [Lint Findings][3]
- [Imports & Exports][4]
- [Contention][8]
  - [Circular Dependencies][9]
  - [Conflicts][10]
  - [Branching][11]
- [VS Code Extension Settings][12]

### Lint Findings

![Lint Findings][13]

### Imports & Exports

![hover][14]

### Contention

The IDE extension shows extra issues in the tree views like circular
dependencies. We're starting out with some extra novelties like conflicting and
branched/diamond-shaped import chains.

#### Circular Dependencies

If an import is part of a circular dependency, Knip will display:

![Circular Dependencies][15]

#### Conflicts

TypeScript shows direct conflicts when importing or re-exporting the same named
export from different files. Except when the problem is more subtle and the
chain spans more than one file. Knip warns:

![Conflicts][16]

#### Branching

Branched or diamond-shaped imports chains indicate unnecessary re-exports and
complexity. They help to untangle large codebases and shrink or get rid of
barrel files. Knip warns:

![Branching][17]

### VS Code Extension Settings

![VS Code Extension Settings][18]

[1]: https://github.com/webpro-nl/knip/network/dependents
[2]: https://www.npmjs.com/package/knip
[3]: #lint-findings
[4]: #imports--exports
[5]: https://marketplace.visualstudio.com/items?itemName=webpro.vscode-knip
[6]: https://www.npmjs.com/package/@knip/mcp
[7]:
  https://github.com/webpro-nl/knip/blob/main/packages/language-server/README.md
[8]: #contention
[9]: #circular-dependencies
[10]: #conflicts
[11]: #branching
[12]: #vs-code-extension-settings
[13]: /screenshots/editors-and-agents/diagnostics.webp
[14]: /screenshots/editors-and-agents/imports-exports.webp
[15]: /screenshots/editors-and-agents/circular-dependency.webp
[16]: /screenshots/editors-and-agents/conflict.webp
[17]: /screenshots/editors-and-agents/branch.webp
[18]: /screenshots/editors-and-agents/vscode-extension-settings.webp
