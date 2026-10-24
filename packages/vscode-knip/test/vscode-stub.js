export const TreeItemCollapsibleState = { None: 0, Collapsed: 1, Expanded: 2 };

export class TreeItem {
  constructor(label, collapsibleState) {
    this.label = label;
    this.collapsibleState = collapsibleState;
  }
}

export class EventEmitter {
  constructor() {
    this.event = () => ({ dispose() {} });
  }
  fire() {}
}

export const Uri = {
  file: fsPath => ({ scheme: 'file', fsPath, toString: () => `file://${fsPath}` }),
};

const disposable = () => ({ dispose() {} });
export const treeProviders = new Map();
export const hoverProviders = [];
export const workspace = {
  workspaceFolders: [{ name: 'workspace', uri: Uri.file('/workspace') }],
  getConfiguration: () => ({ get: (_key, fallback) => fallback }),
  getWorkspaceFolder: () => workspace.workspaceFolders[0],
  createFileSystemWatcher: disposable,
  onDidChangeTextDocument: disposable,
  onDidChangeWorkspaceFolders: disposable,
};
export const window = {
  activeTextEditor: { document: { uri: Uri.file('/workspace/value.js') } },
  createOutputChannel: () => ({ info() {}, error() {} }),
  createTreeView: (id, options) => {
    treeProviders.set(id, options.treeDataProvider);
    return { dispose() {} };
  },
  onDidChangeTextEditorSelection: disposable,
  onDidChangeActiveTextEditor: disposable,
};
export const commands = { registerCommand: disposable };
export const languages = {
  registerHoverProvider: (_selector, provider) => {
    hoverProviders.push(provider);
    return disposable();
  },
  registerCodeLensProvider: disposable,
  onDidChangeDiagnostics: disposable,
};
export const lm = { registerTool: disposable };
export class RelativePattern {}
export class Position {
  constructor(line, character) {
    this.line = line;
    this.character = character;
  }
}

export class MarkdownString {
  constructor(value) {
    this.value = value;
  }
}

export class Hover {
  constructor(contents) {
    this.contents = contents;
  }
}
