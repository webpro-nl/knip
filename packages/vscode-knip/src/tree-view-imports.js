import path from 'node:path';
import { SIDE_EFFECTS } from 'knip/session';
import { BaseTreeViewProvider, toTree } from './tree-view-base.js';

/**
 * @extends {BaseTreeViewProvider}
 */
export class ImportsTreeViewProvider extends BaseTreeViewProvider {
  /** @param {import('knip/session').File} fileNode */
  getFileItems(fileNode) {
    if (fileNode.internalImports.length === 0) return [this.createMessageItem('(none)')];

    const nodes = [];
    for (const _import of fileNode.internalImports) {
      const cycle = fileNode.cycles.find(cycle => cycle[1] === _import.filePath);
      let tooltip = 'Go to import location';
      if (cycle) {
        const cyclePaths = cycle.map(p => (this.workspaceRoot ? path.relative(this.workspaceRoot, p) : p));
        tooltip = `Circular dependency\n\n${cyclePaths.join('\n')}`;
      }
      const isSideEffect = _import.identifier === SIDE_EFFECTS;
      const node = this.createTreeViewItems({
        label: isSideEffect ? '(side effect)' : _import.identifier,
        description: cycle ? '↻' : undefined,
        tooltip,
        tooltipChildren: 'Go to implementation',
        importLine: _import.importLine,
        importCol: _import.importCol,
        children: [{ filePath: _import.filePath, col: _import.col, line: _import.line }],
      });
      node._reveal = { identifier: _import.identifier, line: _import.importLine, col: _import.importCol };
      nodes.push(node);
    }
    return nodes;
  }

  getManifestItems(manifest = this.manifest) {
    if (!manifest) return [this.createMessageItem('Error parsing package.json')];

    const nodes = [];

    if (manifest.imports && typeof manifest.imports === 'object') {
      for (const [specifier, importValue] of Object.entries(manifest.imports)) {
        if (!specifier.startsWith('#')) continue;
        if (typeof importValue === 'string') {
          nodes.push(this.createTreeViewItems({ label: specifier, children: [{ filePath: importValue }] }));
        } else if (importValue === null) {
          nodes.push(this.createTreeViewItems({ label: specifier, children: [{ label: `!${specifier}` }] }));
        } else if (typeof importValue === 'object') {
          const children = toTree(importValue);
          nodes.push(this.createTreeViewItems({ label: specifier, children }));
        }
      }
    }

    if (nodes.length === 0) {
      return [this.createMessageItem('(none)')];
    }

    return nodes;
  }
}
