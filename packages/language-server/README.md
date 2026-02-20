# Knip Language Server

## Knip

The Knip Language Server is powered by Knip: Find unused files, dependencies,
and exports in your JavaScript/TypeScript projects.

- Website: [knip.dev][1]
- GitHub repo: [webpro-nl/knip][2]
- Follow [@webpro.nl on Bluesky][3] for updates
- Blogpost: [Knip for Editors & Agents][4]
- [Sponsor Knip][5]

## Contents

- [Configuration][6]
- [Diagnostics][7]
- [Code Actions][8]
- [File Descriptor][9]
  - [Annotations][10]
  - [Export Hover][11]
  - [Imports][12]
  - [Exports][13]
- [File Descriptor for package.json][14]
  - [Dependency Hover][15]

## Configuration

Latest version of available settings: [types.d.ts][16]

## Diagnostics

Diagnostics should work out of the box.

Most [Knip issue types][17] are translated to `Diagnostic` items with a
`DiagnosticSeverity` and emitted using `this.connection.sendDiagnostics()`. Also
see [diagnostics.js][18] for details.

## Code Actions

Code actions should work out of the box.

Some issues/diagnostics have code actions available. Also see
[code-actions.js][19] for details.

## File Descriptor

Clients request a file descriptor to get available data for a document by
sending the `REQUEST_FILE_NODE` request, in short:

```ts
const file = await this.#client.sendRequest(REQUEST_FILE_NODE, {
  uri: editor.document.uri.toString(),
});
```

Type definition for `File`: [session/types.ts][20]

The file descriptor can be used to implement features like [Annotations][10],
[Export Hover][11], [Imports][12] and [Exports][13].

### Annotations

Annotations (aka "Code Lens" or "Inlay Hint") for exported identifiers can be
implemented using data from the file descriptor.

Example:

- [registerCodeLensProvider][21]

### Export Hover

On hover of an export identifier, the file descriptor can be used to render
import locations for the exported identifier.

Optionally, code snippets can be searched for using the provided locations and
mixed into the rendered list.

Example:

- [registerHoverProvider → getHoverContent][21]
- [Collect hover snippets][22]
- [Render export hover][23]

### Imports

The file desciptor can be used to display an overview of imports of a document
with direct links to their definition location.

Optionally, the client can implement:

- Follow cursor between open document and highlight import in view
- Show cyclic dependencies

Example:

- [setupTreeViews + refresh → getFileForTreeViews][21]
- [Tree View Imports][24]

### Exports

The file desciptor can be used to display an overview of exports of a document
with direct links to their usage locations.

Optionally, the client can implement:

- Follow cursor between open document and highlight export in view
- Show contention: naming conflicts through re-exports
- Show contention: branched/diamond-shaped re-export structures

Example:

- [setupTreeViews + refresh → getFileForTreeViews][21]
- [Tree View Exports][25]

## File Descriptor for package.json

Clients request the `package.json` file descriptor to get dependency usage data
by sending the `REQUEST_PACKAGE_JSON` request:

```ts
const packageJson = await this.#client.sendRequest(REQUEST_PACKAGE_JSON);
```

Type definition for `DependencyNodes`: [session/types.ts][20]

### Dependency Hover

On hover of a dependency name in `package.json`, the `packageJson` descriptor
can be used to render import locations for the dependency.

Example:

- [getDependencyHoverContent][21]
- [Collect dependency snippets][26]
- [Render dependency hover][27]

## CLI

To run the language server directly from CLI:

```sh
npx @knip/language-server
```

Add `--node-ipc`, `--stdio`, `--socket <port>` or `--pipe <name>` to set
transport (default: `--stdio`).

[1]: https://knip.dev
[2]: https://github.com/webpro-nl/knip
[3]: https://bsky.app/profile/webpro.nl
[4]: https://knip.dev/blog/for-editors-and-agents
[5]: https://knip.dev/sponsors
[6]: #configuration
[7]: #diagnostics
[8]: #code-actions
[9]: #file-descriptor
[10]: #annotations
[11]: #export-hover
[12]: #imports
[13]: #exports
[14]: #file-descriptor-for-packagejson
[15]: #dependency-hover
[16]: ./src/types.d.ts
[17]: https://knip.dev/reference/issue-types
[18]: ./src/diagnostics.js
[19]: ./src/code-actions.js
[20]: ../knip/src/session/types.ts
[21]: ../vscode-knip/src/index.js
[22]: ../vscode-knip/src/collect-export-hover-snippets.js
[23]: ../vscode-knip/src/render-export-hover.js
[24]: ../vscode-knip/src/tree-view-imports.js
[25]: ../vscode-knip/src/tree-view-exports.js
[26]: ../vscode-knip/src/collect-dependency-hover-snippets.js
[27]: ../vscode-knip/src/render-dependency-hover.js
