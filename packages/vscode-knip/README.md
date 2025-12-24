# Knip VS Code Extension

This extension is powered by Knip: Find unused files, dependencies, and exports
in your JavaScript/TypeScript projects.

- Website: [knip.dev][1]
- GitHub repo: [webpro-nl/knip][2]
- Follow [@webpro.nl on Bluesky][3] for updates
- Blogpost: [Knip for Editors & Agents][4]
- [Sponsor Knip][5]

## What Is This?

[The usual suspects][6] like red squiggles for unused exports are there. What
really moves the needle for DX with Knip's module graph is **navigation**. A
completely unique way to view & fly through codebases for developers who care.
Connect the dots during development and refactors, while keeping things in
check. We're starting out with [3 key features][7]:

1. **Hover over Export** for import & usage locations
2. **Imports Tree View** for direct links to implementations
3. **Exports Tree View** for direct links to import & usage locations

## Features

- Diagnostics for unused files, dependencies, and exports
- Hover on exports to see import locations
- Tree views for imports and exports
- Code actions to fix or ignore issues
- CodeLens showing import counts for exports

## MCP Tools

The extension provides MCP tools for coding agents:

- `knip-configure` — Run Knip and configure
- `knip-docs` — Get Knip documentation by topic

In other words, you can tell your coding agent to "configure knip" and it will
RTFM so you don't have to. Using a newer model results in an optimized
`knip.json` file and an uncluttered codebase.

## Screenshots

- [Lint Findings][6]
- [Imports & Exports][7]
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

[1]: https://knip.dev
[2]: https://github.com/webpro-nl/knip
[3]: https://bsky.app/profile/webpro.nl
[4]: https://knip.dev/blog/for-editors-and-agents
[5]: https://knip.dev/sponsors
[6]: #lint-findings
[7]: #imports--exports
[8]: #contention
[9]: #circular-dependencies
[10]: #conflicts
[11]: #branching
[12]: #vs-code-extension-settings
[13]: https://knip.dev/screenshots/editors-and-agents/diagnostics.webp
[14]: https://knip.dev/screenshots/editors-and-agents/imports-exports.webp
[15]: https://knip.dev/screenshots/editors-and-agents/circular-dependency.webp
[16]: https://knip.dev/screenshots/editors-and-agents/conflict.webp
[17]: https://knip.dev/screenshots/editors-and-agents/branch.webp
[18]:
  https://knip.dev/screenshots/editors-and-agents/vscode-extension-settings.webp
