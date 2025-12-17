# Knip Language Server

## Knip

Find unused files, dependencies, and exports in your JavaScript/TypeScript
projects.

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

## Configuration

Latest version of available settings: [types.d.ts][14]

## Diagnostics

Diagnostics should work out of the box.

Most [Knip issue types][15] are translated to `Diagnostic` items with a
`DiagnosticSeverity` and emitted using `this.connection.sendDiagnostics()`. Also
see [diagnostics.js][16] for details.

## Code Actions

Code actions should work out of the box.

Some issues/diagnostics have code actions available. Also see
[code-actions.js][17] for details.

## File Descriptor

Clients request the `file` descriptor to get available data for a document by
sending the `REQUEST_FILE_NODE` request, in short:

```ts
const file = await this.#client.sendRequest(REQUEST_FILE_NODE, {
  uri: editor.document.uri.toString(),
});
```

Type definition for `File`: [session/types.ts][18]

The `file` descriptor can be used to implement features like [Annotations][10],
[Export Hover][11], [Imports][12] and [Exports][13].

### Annotations

Annotations (aka "Code Lens" or "Inlay Hint") for exported identifiers can be
implemented using data from the `file` descriptor.

Example:

- [registerCodeLensProvider][19]

### Export Hover

On hover of an export identifier, the `file` descriptor can be used to render
import locations for the exported identifier.

Optionally, code snippets can be searched for using the provided locations and
mixed into the rendered list.

Example:

- [registerHoverProvider → getHoverContent][19]
- [Collect hover snippets][20]
- [Render export hover][21]

### Imports

The `file` desciptor can be used to display an overview of imports of a document
with direct links to their definition location.

Optionally, the client can implement:

- Follow cursor between open document and highlight import in view
- Show cyclic dependencies

Example:

- [setupTreeViews + refresh → getFileForTreeViews][19]
- [Tree View Imports][22]

### Exports

The `file` desciptor can be used to display an overview of exports of a document
with direct links to their usage locations.

Optionally, the client can implement:

- Follow cursor between open document and highlight export in view
- Show contention: naming conflicts through re-exports
- Show contention: branched/diamond-shaped re-export structures

Example:

- [setupTreeViews + refresh → getFileForTreeViews][19]
- [Tree View Exports][23]

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
[14]: ./src/types.d.ts
[15]: https://knip.dev/reference/issue-types
[16]: ./src/diagnostics.js
[17]: ./src/code-actions.js
[18]: ../knip/src/session/types.ts
[19]: ../vscode-knip/src/index.js
[20]: ../vscode-knip/src/collect-hover-snippets.js
[21]: ../vscode-knip/src/render-export-hover.js
[22]: ../vscode-knip/src/tree-view-imports.js
[23]: ../vscode-knip/src/tree-view-exports.js
