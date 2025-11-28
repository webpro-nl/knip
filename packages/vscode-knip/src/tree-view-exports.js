import { BaseTreeViewProvider, toTree } from './tree-view-base.js';

const CONTENTION_ICONS = {
  contention: '►',
  branching: '◇',
  conflict: '‼︎',
  unused: '',
};

const CONTENTION_TOOLTIPS = {
  branching: 'Contention: branch location',
  conflict: 'Contention: conflict location',
};

/**
 * @extends {BaseTreeViewProvider}
 */
export class ExportsTreeViewProvider extends BaseTreeViewProvider {
  /** @param {import('knip/session').File} fileNode */
  getFileItems(fileNode) {
    const isDeferChildren = fileNode.exports.length > 9;
    const nodes = fileNode.exports.map(_export => this.createExportNode(_export, isDeferChildren, fileNode.contention));
    if (nodes.length === 0) return [this.createMessageItem('(none)')];
    return nodes;
  }

  /**
   * @param {import('knip/session').Export} _export
   * @param {boolean} [isDeferChildren]
   * @param {Record<string, import('knip/session').ContentionDetails>} [contention]
   */
  createExportNode(_export, isDeferChildren, contention) {
    const contentionDetails = contention?.[_export.identifier];
    const contentionItems = this.createContentionDescriptors(contentionDetails).map(d => this.createTreeViewItems(d));

    const children =
      _export.exports && _export.exports.length > 0
        ? [..._export.exports.map(e => this.createExportNode(e, isDeferChildren, contention)), ...contentionItems]
        : [
            ...(_export.importLocations ?? []).map(location => ({
              filePath: location.filePath,
              line: location.line,
              col: location.col,
              icon: '→',
            })),
            ...contentionItems,
          ];

    const size = _export.importLocations.length;
    const branchingCount = contentionDetails?.branching.length ?? 0;
    const conflictCount = contentionDetails?.conflict.length ?? 0;
    const contentionCount = branchingCount + conflictCount;
    const descriptionParts = [`imported ${size}x`];
    if (contentionCount > 0) descriptionParts.push(`contention ${contentionCount}x`);
    const node = this.createTreeViewItems({
      label: _export.identifier,
      tooltip: 'Go to export location',
      tooltipChildren: 'Go to usage or contention location',
      line: _export.line,
      col: _export.col,
      description: `${contentionCount > 0 ? CONTENTION_ICONS.contention : size > 0 ? '' : CONTENTION_ICONS.unused} ${descriptionParts.join(' / ')}`,
      children,
      lazy: isDeferChildren,
    });
    node._reveal = { identifier: _export.identifier, line: _export.line, col: _export.col };
    return node;
  }

  /** @param {import('knip/session').ContentionDetails} [contentionDetails] */
  createContentionDescriptors(contentionDetails) {
    if (!contentionDetails) return [];
    /** @type {{ filePath: string; icon: string; tooltip: string }[]} */
    const descriptors = [];
    /** @param {'branching' | 'conflict'} type @param {string[]} [filePaths] */
    const pushDescriptors = (type, filePaths) => {
      if (!filePaths) return;
      for (const filePath of filePaths) {
        descriptors.push({ filePath, icon: CONTENTION_ICONS[type], tooltip: CONTENTION_TOOLTIPS[type] });
      }
    };
    pushDescriptors('branching', contentionDetails.branching);
    pushDescriptors('conflict', contentionDetails.conflict);
    return descriptors;
  }

  /**
   * @returns {import('vscode').TreeItem[]}
   */
  getManifestItems() {
    const manifest = this.manifest;
    if (!manifest) {
      return [this.createMessageItem('Error parsing package.json')];
    }
    const nodes = [];

    const stringFields = ['main', 'module', 'browser', 'types', 'typings'];
    for (const field of stringFields) {
      if (typeof manifest[field] === 'string') {
        nodes.push(this.createTreeViewItems({ label: field, children: [{ filePath: manifest[field] }] }));
      }
    }

    if (typeof manifest.bin === 'string') {
      nodes.push(this.createTreeViewItems({ label: 'bin', children: [{ filePath: manifest.bin }] }));
    } else if (manifest.bin && typeof manifest.bin === 'object') {
      const children = Object.entries(manifest.bin)
        .filter(([, value]) => typeof value === 'string')
        .map(([name, value]) => ({ label: name, children: [{ filePath: value }] }));
      if (children.length > 0) nodes.push(this.createTreeViewItems({ label: 'bin', children }));
    }

    if (manifest.exports && typeof manifest.exports === 'object') {
      for (const [specifier, exportValue] of Object.entries(manifest.exports)) {
        if (typeof exportValue === 'string') {
          nodes.push(this.createTreeViewItems({ label: specifier, children: [{ filePath: exportValue }] }));
        } else if (exportValue === null) {
          nodes.push(this.createTreeViewItems({ label: specifier, children: [{ label: `!${specifier}` }] }));
        } else if (typeof exportValue === 'object') {
          const children = toTree(exportValue);
          nodes.push(this.createTreeViewItems({ label: specifier, children }));
        }
      }
    }

    if (nodes.length === 0) return [this.createMessageItem('(none)')];

    return nodes;
  }
}
