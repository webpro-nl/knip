---
title: Knip for Editors & Agents
date: 2025-12-18
sidebar:
  order: 1
---

_Published: 2025-12-18_

## VS Code Extension

This one is for you.

[The usual suspects][1] like red squiggles for unused exports are there. What
really moves the needle for DX with Knip's module graph is **navigation**. A
completely unique way to view & fly through codebases for developers who care.
Connect the dots during development and refactors, while keeping things in
check. We're starting out with [3 key features][2]:

1. **Hover over Export** for import & usage locations
2. **Imports Tree View** for direct links to implementations
3. **Exports Tree View** for direct links to import & usage locations

## MCP Server

Configuring Knip has always been a major headache to many. No more. Tell your
coding agent to "configure knip" and it will RTFM so you don't have to. Using a
newer model like Opus 4.5 or GPT 5.2 results in an optimized `knip.json` file
and an uncluttered codebase.

The [MCP Server is available][3] separately and built into the VS Code
Extension.

## Language Server

The VS Code Extension and the MCP Server are powered by the new Language Server.
It's a custom server that builds the full module graph of your project, and
provides a session with a graph explorer to request all sorts of interesting
information. Queries like "where is an export imported" or "is this import part
of a circular dependency" are just scratching the surface here.

Extensions for other IDEs can be built on top. See
[language-server/README.md][4]

## Screenshots

- [Lint Findings][1]
- [Imports & Exports][2]
- [Contention][5]
  - [Circular Dependencies][6]
  - [Conflicts][7]
  - [Branching][8]
- [VS Code Extension Settings][9]

### Lint Findings

![Lint Findings][10]

### Imports & Exports

![hover][11]

### Contention

The IDE extension shows extra issues in the tree views like circular
dependencies. We're starting out with some extra novelties like conflicting and
branched/diamond-shaped import chains.

#### Circular Dependencies

If an import is part of a circular dependency, Knip will display:

![Circular Dependencies][12]

#### Conflicts

TypeScript shows direct conflicts when importing or re-exporting the same named
export from different files. Except when the problem is more subtle and the
chain spans more than one file. Knip warns:

![Conflicts][13]

#### Branching

Branched or diamond-shaped imports chains indicate unnecessary re-exports and
complexity. They help to untangle large codebases and shrink or get rid of
barrel files. Knip warns:

![Branching][14]

### VS Code Extension Settings

![VS Code Extension Settings][15]

[1]: #lint-findings
[2]: #imports--exports
[3]: https://github.com/webpro-nl/knip/blob/main/packages/mcp-server/README.md
[4]: https://www.npmjs.com/package/@knip/mcp
[5]: #contention
[6]: #circular-dependencies
[7]: #conflicts
[8]: #branching
[9]: #vs-code-extension-settings
[10]: /screenshots/editors-and-agents/diagnostics.webp
[11]: /screenshots/editors-and-agents/imports-exports.webp
[12]: /screenshots/editors-and-agents/circular-dependency.webp
[13]: /screenshots/editors-and-agents/conflict.webp
[14]: /screenshots/editors-and-agents/branch.webp
[15]: /screenshots/editors-and-agents/vscode-extension-settings.webp
