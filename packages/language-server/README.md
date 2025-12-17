# Knip Language Server

## Knip

Find unused files, dependencies, and exports in your JavaScript/TypeScript
projects.

- Website: [knip.dev][1]
- GitHub repo: [webpro-nl/knip][2]
- Follow [@webpro.nl on Bluesky][3] for updates
- [Sponsor Knip][4]

## Contents

- [Configuration][5]
- [Diagnostics][6]
- [Code Actions][7]
- [File Descriptor][8]
  - [Annotations][9]
  - [Export Hover][10]
  - [Imports][11]
  - [Exports][12]

## Configuration

Latest version of available settings: [types.d.ts][13]

## Diagnostics

Diagnostics should work out of the box.

Most [Knip issue types][14] are translated to `Diagnostic` items with a
`DiagnosticSeverity` and emitted using `this.connection.sendDiagnostics()`. Also
see [diagnostics.js][15] for details.

## Code Actions

Code actions should work out of the box.

Some issues/diagnostics have code actions available. Also see
[code-actions.js][16] for details.

## File Descriptor

Clients request the `file` descriptor to get available data for a document by
sending the `REQUEST_FILE_NODE` request, in short:

```ts
const file = await this.#client.sendRequest(REQUEST_FILE_NODE, {
  uri: editor.document.uri.toString(),
});
```

Type definition for `File`: [session/types.ts][17]

The `file` descriptor can be used to implement features like [Annotations][9],
[Export Hover][10], [Imports][11] and [Exports][12].

### Annotations

Annotations (aka "Code Lens" or "Inlay Hint") for exported identifiers can be
implemented using data from the `file` descriptor.

Example:

- [registerCodeLensProvider][18]

### Export Hover

On hover of an export identifier, the `file` descriptor can be used to render
import locations for the exported identifier.

Optionally, code snippets can be searched for using the provided locations and
mixed into the rendered list.

Example:

- [registerHoverProvider → getHoverContent][18]
- [Collect hover snippets][19]
- [Render export hover][20]

### Imports

The `file` desciptor can be used to display an overview of imports of a document
with direct links to their definition location.

Optionally, the client can implement:

- Follow cursor between open document and highlight import in view
- Show cyclic dependencies

Example:

- [setupTreeViews + refresh → getFileForTreeViews][18]
- [Tree View Imports][21]

### Exports

The `file` desciptor can be used to display an overview of exports of a document
with direct links to their usage locations.

Optionally, the client can implement:

- Follow cursor between open document and highlight export in view
- Show contention: naming conflicts through re-exports
- Show contention: branched/diamond-shaped re-export structures

Example:

- [setupTreeViews + refresh → getFileForTreeViews][18]
- [Tree View Exports][22]

[1]: https://knip.dev
[2]: https://github.com/webpro-nl/knip
[3]: https://bsky.app/profile/webpro.nl
[4]: https://knip.dev/sponsors
[5]: #configuration
[6]: #diagnostics
[7]: #code-actions
[8]: #file-descriptor
[9]: #annotations
[10]: #export-hover
[11]: #imports
[12]: #exports
[13]: ./src/types.d.ts
[14]: https://knip.dev/reference/issue-types
[15]: ./src/diagnostics.js
[16]: ./src/code-actions.js
[17]: ../knip/src/session/types.ts
[18]: ../vscode-knip/src/index.js
[19]: ../vscode-knip/src/collect-hover-snippets.js
[20]: ../vscode-knip/src/render-export-hover.js
[21]: ../vscode-knip/src/tree-view-imports.js
[22]: ../vscode-knip/src/tree-view-exports.js
