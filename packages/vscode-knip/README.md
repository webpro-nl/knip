# Knip Editor Extension for VS Code/Open VSX

The Knip Editor Extension for VS Code/Open VSX is powered by Knip: Find unused
files, dependencies, and exports in your JavaScript/TypeScript projects.

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
  - [Ambiguous][10]
  - [Shadowed][11]
  - [Converged][12]
- [VS Code Extension Settings][13]

### Lint Findings

![Lint Findings][14]

### Imports & Exports

![hover][15]

### Contention

The extension shows circular dependencies and three kinds of export contention: ambiguous, shadowed, and converged.

#### Circular Dependencies

If an import is part of a circular dependency, Knip will display:

![Circular Dependencies][16]

#### Ambiguous

Different bindings compete for the same name, with no winner. Knip lists the competing bindings.

![Ambiguous][17]

#### Shadowed

An explicit export hides bindings from `export *`. Knip labels the site as "shadowing" and lists the winning and hidden bindings.

![Shadowed][18]

#### Converged

The same binding arrives through multiple re-export paths. Knip shows where those paths meet and the binding they share.

![Converged][19]

### VS Code Extension Settings

![VS Code Extension Settings][20]

[1]: https://knip.dev
[2]: https://github.com/webpro-nl/knip
[3]: https://bsky.app/profile/webpro.nl
[4]: https://knip.dev/blog/for-editors-and-agents
[5]: https://knip.dev/sponsors
[6]: #lint-findings
[7]: #imports--exports
[8]: #contention
[9]: #circular-dependencies
[10]: #ambiguous
[11]: #shadowed
[12]: #converged
[13]: #vs-code-extension-settings
[14]: https://knip.dev/screenshots/editors-and-agents/diagnostics.webp
[15]: https://knip.dev/screenshots/editors-and-agents/imports-exports.webp
[16]: https://knip.dev/screenshots/editors-and-agents/circular-dependency.webp
[17]: https://knip.dev/screenshots/editors-and-agents/ambiguous.webp
[18]: https://knip.dev/screenshots/editors-and-agents/shadow.webp
[19]: https://knip.dev/screenshots/editors-and-agents/branch.webp
[20]:
  https://knip.dev/screenshots/editors-and-agents/vscode-extension-settings.webp
