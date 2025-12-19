import path from 'node:path';
import * as vscode from 'vscode';

/**
 * @import { File, PackageJson } from 'knip/session'
 */

/**
 * @typedef {{ label?: string; filePath?: string; children?: TreeNode[] }} TreeNode
 *
 * @typedef {vscode.TreeItem & {
 *   _parent?: TreeViewItem;
 *   _children?: TreeViewItem[];
 *   _reveal?: { identifier: string; line: number; col: number; };
 * }} TreeViewItem
 *
 * @typedef {{ kind: 'file'; uri: vscode.Uri; file: File }
 *   | { kind: 'manifest'; uri: vscode.Uri; manifest: PackageJson }
 *   | { message: string }
 * } TreeData
 */

/** @implements {vscode.TreeDataProvider<TreeViewItem>} */
export class BaseTreeViewProvider {
  constructor() {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.currentUri = undefined;
    this.currentPosition = undefined;
    this.statusMessage = undefined;
    this.treeView = undefined;

    /** @type {undefined | 'file' | 'manifest'}  */
    this.kind = undefined;
    /** @type {undefined  | PackageJson} */
    this.manifest = undefined;
    /** @type {undefined  | File} */
    this.file = undefined;
    /** @type {TreeViewItem[]} */
    this._rootItems = [];
  }

  /** @param {vscode.TreeView<vscode.TreeItem>} treeView */
  setTreeView(treeView) {
    this.treeView = treeView;
  }

  /**
   * @public
   * @param {TreeViewItem} element
   */
  getTreeItem(element) {
    return element;
  }

  /**
   * @param {TreeData | undefined} data
   * @param {vscode.Position | undefined} position
   */
  async refresh(data, position) {
    this.currentPosition = position;
    this.statusMessage = undefined;
    this.currentUri = undefined;
    this.kind = undefined;
    this.file = undefined;
    this.manifest = undefined;

    if (data && 'message' in data) {
      this.statusMessage = data.message;
    } else if (data?.kind === 'file') {
      this.currentUri = data.uri;
      this.kind = 'file';
      this.file = data.file;
    } else if (data?.kind === 'manifest') {
      this.currentUri = data.uri;
      this.kind = 'manifest';
      this.manifest = data.manifest;
    }

    this._onDidChangeTreeData.fire(null);

    if (this.currentUri) {
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(this.currentUri);
      this.workspaceRoot = workspaceFolder?.uri.fsPath;
    }
  }

  /** @param {vscode.Position} position */
  updatePosition(position) {
    this.currentPosition = position;
    if (
      position &&
      this.kind === 'file' &&
      this.file &&
      this.treeView &&
      typeof this.revealItemAtCursor === 'function'
    ) {
      this.revealItemAtCursor(position);
    }
  }

  /**
   * @param {string} label
   * @param {string} [tooltip]
   * @returns {TreeViewItem}
   */
  createMessageItem(label, tooltip) {
    const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
    if (tooltip) {
      item.tooltip = tooltip;
    }
    return /** @type {TreeViewItem} */ (item);
  }

  /** @param {string} [message] */
  clear(message) {
    this.currentUri = undefined;
    this.currentPosition = null;
    this.kind = undefined;
    this.file = undefined;
    this.manifest = undefined;
    this.statusMessage = message ?? null;
    this._onDidChangeTreeData.fire(null);
  }

  /** @param {vscode.Position} position */
  async revealItemAtCursor(position) {
    if (!this.file || !this.treeView) return;

    try {
      const items = this._rootItems ?? [];
      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const node = item._reveal;
        if (!node) continue;
        const itemLine = node.line - 1;
        if (position.line > itemLine || (position.line === itemLine && position.character >= node.col - 1)) {
          await this.treeView.reveal(item, { select: true, focus: false, expand: 1 });
          return;
        }
      }
    } catch (_error) {}
  }

  /**
   * @public
   * @param {TreeViewItem | undefined} [element]
   * @returns {import('vscode').ProviderResult<TreeViewItem[]>}
   */
  getChildren(element) {
    if (element) {
      if (!element._children) return [];
      if (element._children[0] instanceof vscode.TreeItem) return element._children;
      return (element._children ?? []).map(child => this.createTreeViewItems(Object.assign(child, { lazy: true })));
    }

    if (!this.currentUri) {
      return this.statusMessage ? [this.createMessageItem(this.statusMessage)] : [];
    }

    if (this.kind === 'manifest') {
      this._rootItems = [];
      return this.getManifestItems();
    }

    const fileNode = this.file;
    if (!fileNode) {
      this._rootItems = [];
      return [this.createMessageItem(this.statusMessage ?? '(bliep boop bap why are we here?)')];
    }

    const items = this.getFileItems(fileNode);
    this._rootItems = Array.isArray(items) ? items : [];
    return items;
  }

  /**
   * @public
   * @param {TreeViewItem} element
   * @returns {TreeViewItem | undefined}
   */
  getParent(element) {
    return element?._parent;
  }

  /** @returns {TreeViewItem[]} */
  getManifestItems() {
    throw new Error('subclass impl missing');
  }

  /**
   * @param {File} _file
   * @returns {TreeViewItem[]}
   */
  getFileItems(_file) {
    throw new Error('subclass impl missing');
  }

  /**
   * @typedef {{
   *  label?: string;
   *  tooltip?: string;
   *  tooltipChildren?: string;
   *  description?: string;
   *  filePath?: string;
   *  line?: number;
   *  col?: number;
   *  importLine?: number;
   *  importCol?: number;
   *  icon?: string;
   *  lazy?: boolean
   *  children?: Node[];
   * }} Node;
   * @param {Node} options
   * @returns {TreeViewItem}
   */
  createTreeViewItems(options) {
    const { filePath, line, col, importLine, importCol } = options;

    const absPath =
      filePath &&
      (path.isAbsolute(filePath) ? filePath : this.workspaceRoot && path.join(this.workspaceRoot, filePath));

    const uri = absPath ? vscode.Uri.file(absPath) : undefined;
    const relPath = absPath
      ? this.workspaceRoot
        ? path.relative(this.workspaceRoot, absPath) || path.basename(absPath)
        : absPath
      : undefined;

    let command;
    if (importLine !== undefined && this.currentUri) {
      command = {
        command: 'knip.goToPosition',
        title: 'Go to import',
        arguments: [this.currentUri, Math.max(importLine - 1, 0), Math.max((importCol ?? 1) - 1, 0)],
      };
    } else if (line !== undefined) {
      const targetUri = uri ?? this.currentUri;
      if (targetUri) {
        command = {
          command: 'knip.goToPosition',
          title: 'Go to export',
          arguments: [targetUri, Math.max(line - 1, 0), Math.max((col ?? 1) - 1, 0)],
        };
      }
    } else if (uri) {
      command = {
        command: 'vscode.open',
        title: 'Open File',
        arguments: [uri],
      };
    }

    const children = options.children?.[0]?.filePath
      ? options.children.toSorted((a, b) => (a.filePath && b.filePath ? a.filePath.localeCompare(b.filePath) : 0))
      : (options.children ?? []);

    const node = this.createTreeViewItem({
      label: filePath ? (options.icon ?? '→') : (options.label ?? ''),
      tooltip: options.tooltip ?? '',
      description: filePath ? relPath : options.description,
      command,
      size: children.length,
    });

    if (!options.lazy) {
      for (let i = 0; i < children.length; i++) {
        if (children[i] instanceof vscode.TreeItem) continue;
        children[i].tooltip = children[i].tooltip ?? options.tooltipChildren;
        children[i] = this.createTreeViewItems(children[i]);
        children[i]._parent = node;
      }
    }

    return Object.assign(node, { _children: children });
  }

  /**
   * @typedef {{
   *  label: string;
   *  tooltip: string;
   *  description?: string;
   *  command?: vscode.Command;
   *  size: number;
   * }} Options;
   * @param {Options} options
   */
  createTreeViewItem(options) {
    const state =
      options.size > 0
        ? options.size > 10
          ? vscode.TreeItemCollapsibleState.Collapsed
          : vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None;
    const item = new vscode.TreeItem(options.label, state);
    item.description = options.description;
    item.command = options.command;
    item.tooltip = options.tooltip;
    return item;
  }
}

/**
 * @param {unknown} value
 * @returns {TreeNode[]}
 */
export const toTree = value => {
  if (typeof value === 'string') return [{ filePath: value }];
  if (value === null) return [{ label: '!value' }];
  if (Array.isArray(value)) return value.map((entry, index) => ({ label: `[${index}]`, children: toTree(entry) }));
  if (typeof value !== 'object') return [{ label: String(value) }];
  const record = /** @type {Record<string, unknown>} */ (value);
  return Object.keys(record)
    .sort()
    .map(key => ({ label: key, children: toTree(record[key]) }));
};
