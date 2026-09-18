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
