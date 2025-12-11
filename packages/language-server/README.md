# Knip Language Server

## Contents

- [Configuration][1]
- [Diagnostics][2]
- [Code Actions][3]
- [File Descriptor][4]
  - [Annotations][5]
  - [Export Hover][6]
  - [Imports][7]
  - [Exports][8]

## Configuration

Latest version of available settings: [types.d.ts][9]

## Diagnostics

Diagnostics should work out of the box.

Most [Knip issue types][10] are translated to `Diagnostic` items with a
`DiagnosticSeverity` and emitted using `this.connection.sendDiagnostics()`. Also
see [diagnostics.js][11] for details.

## Code Actions

Code actions should work out of the box.

Some issues/diagnostics have code actions available. Also see
[code-actions.js][12] for details.

## File Descriptor

Clients request the `file` descriptor to get available data for a document by
sending the `REQUEST_FILE_NODE` request, in short:

```ts
const file = await this.#client.sendRequest(REQUEST_FILE_NODE, {
  uri: editor.document.uri.toString()
});
```

Type definition for `File`: [session/types.ts][13]

The `file` descriptor can be used to implement features like [Annotations][5],
[Export Hover][6], [Imports][7] and [Exports][8].

### Annotations

Annotations (aka "Code Lens" or "Inlay Hint") for exported identifiers can be
implemented using data from the `file` descriptor.

Example:

- [registerCodeLensProvider][14]

### Export Hover

On hover of an export identifier, the `file` descriptor can be used to render
import locations for the exported identifier.

Optionally, code snippets can be searched for using the provided locations and
mixed into the rendered list.

Example:

- [registerHoverProvider → getHoverContent][14]
- [Collect hover snippets][15]
- [Render export hover][16]

### Imports

The `file` desciptor can be used to display an overview of imports of a document
with direct links to their definition location.

Optionally, the client can implement:

- Follow cursor between open document and highlight import in view
- Show cyclic dependencies

Example:

- [setupTreeViews + refresh → getFileForTreeViews][14]
- [Tree View Imports][17]

### Exports

The `file` desciptor can be used to display an overview of exports of a document
with direct links to their usage locations.

Optionally, the client can implement:

- Follow cursor between open document and highlight export in view
- Show contention: naming conflicts through re-exports
- Show contention: branched/diamond-shaped re-export structures

Example:

- [setupTreeViews + refresh → getFileForTreeViews][14]
- [Tree View Exports][18]

[1]: #configuration
[2]: #diagnostics
[3]: #code-actions
[4]: #file-descriptor
[5]: #annotations
[6]: #export-hover
[7]: #imports
[8]: #exports
[9]: ./src/types.d.ts
[10]: https://knip.dev/reference/issue-types
[11]: ./src/diagnostics.js
[12]: ./src/code-actions.js
[13]: ../knip/src/session/types.ts
[14]: ../vscode-knip/src/index.js
[15]: ../vscode-knip/src/collect-hover-snippets.js
[16]: ../vscode-knip/src/render-export-hover.js
[17]: ../vscode-knip/src/tree-view-imports.js
[18]: ../vscode-knip/src/tree-view-exports.js
