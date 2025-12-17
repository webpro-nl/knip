# Knip VS Code Extension

## Knip

Find unused files, dependencies, and exports in your JavaScript/TypeScript
projects.

- Website: [knip.dev][1]
- GitHub repo: [webpro-nl/knip][2]
- Follow [@webpro.nl on Bluesky][3] for updates
- Blogpost: [Knip for Editors & Agents][4]
- [Sponsor Knip][5]

## Features

- Diagnostics for unused files, dependencies, and exports
- CodeLens showing import counts for exports
- Hover on exports to see import locations
- Code actions to fix or ignore issues
- Tree views for imports and exports

## Tools for Coding Agents

### GitHub Copilot

The extension provides MCP tools for GitHub Copilot:

- `knip-configure` — Run Knip and configure
- `knip-docs` — Get Knip documentation by topic

## Screenshots

- [Lint Problems][6]
- [Imports & Exports][7]
- [Contention][8]
  - [Circular Dependencies][9]
  - [Conflicts][10]
  - [Branching][11]
- [VS Code Extension Settings][12]

### Lint Problems

![Lint Problems][13]

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
[6]: #lint-problems
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
