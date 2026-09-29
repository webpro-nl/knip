import path from 'node:path';
import { BaseTreeViewProvider, toTree } from './tree-view-base.js';

/**
 * @typedef {import('knip/session').ContentionDetails} ContentionDetails
 *
 * @typedef {Omit<ContentionDetails, 'sites'> & Partial<ContentionDetails>} ContentionDetailsLike
 *
 * @typedef {{
 *  label?: string;
 *  filePath?: string;
 *  line?: number;
 *  col?: number;
 *  icon?: string;
 *  tooltip: string;
 *  children?: ContentionDescriptor[];
 * }} ContentionDescriptor
 */

const CONTENTION_ICONS = {
  contention: '►',
  ambiguous: '‼︎',
  shadowed: '⊘',
  converged: '◇',
  winner: '✓',
  unused: '',
};

const ORIGIN_ROLES = {
  ambiguous: 'Competing binding',
  shadowed: 'Hidden binding',
  converged: 'Origin binding',
  winner: 'Winning binding',
  origin: 'Origin binding',
};

const LEGACY_TOOLTIPS = {
  branching: 'Contention: branch location',
  conflict: 'Contention: conflict location',
};

/**
 * @extends {BaseTreeViewProvider}
 */
export class ExportsTreeViewProvider extends BaseTreeViewProvider {
  constructor() {
    super('exports');
  }

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
   * @param {Record<string, ContentionDetails>} [contention]
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
    const contentionSummary = this.getContentionSummary(contentionDetails);
    const descriptionParts = [`imported ${size}x`];
    if (contentionSummary) descriptionParts.push(contentionSummary);
    const node = this.createTreeViewItems({
      label: _export.identifier,
      tooltip: 'Go to export location',
      tooltipChildren: 'Go to usage or contention location',
      line: _export.line,
      col: _export.col,
      description: `${contentionSummary ? CONTENTION_ICONS.contention : size > 0 ? '' : CONTENTION_ICONS.unused} ${descriptionParts.join(' / ')}`,
      children,
      lazy: isDeferChildren,
    });
    node._reveal = { identifier: _export.identifier, line: _export.line, col: _export.col };
    return node;
  }

  /** @param {ContentionDetailsLike} [contentionDetails] */
  getContentionSummary(contentionDetails) {
    if (!contentionDetails) return;
    if (!contentionDetails.sites?.length) {
      const count = contentionDetails.branching.length + contentionDetails.conflict.length;
      return count > 0 ? `contention ${count}x` : undefined;
    }
    const [site] = contentionDetails.sites;
    let sameKind = 0;
    for (const { kind } of contentionDetails.sites) if (kind === site.kind) sameKind++;
    const count = sameKind > 1 ? ` ${sameKind}x` : '';
    const at = this.isDescribedFile(site.filePath) ? '' : ` at ${this.toRelativePath(site.filePath)}`;
    const kind = site.kind === 'shadowed' ? 'shadowing' : site.kind;
    return `${kind}${count}${at}`;
  }

  /**
   * @param {ContentionDetailsLike} [contentionDetails]
   * @returns {ContentionDescriptor[]}
   */
  createContentionDescriptors(contentionDetails) {
    if (!contentionDetails) return [];
    /** @type {ContentionDescriptor[]} */
    const descriptors = [];

    if (!contentionDetails.sites?.length) {
      for (const filePath of contentionDetails.branching) {
        descriptors.push({ filePath, icon: CONTENTION_ICONS.converged, tooltip: LEGACY_TOOLTIPS.branching });
      }
      for (const filePath of contentionDetails.conflict) {
        descriptors.push({ filePath, icon: CONTENTION_ICONS.ambiguous, tooltip: LEGACY_TOOLTIPS.conflict });
      }
      return descriptors;
    }

    for (const site of contentionDetails.sites) {
      const icon = CONTENTION_ICONS[site.kind] ?? CONTENTION_ICONS.contention;
      const role = ORIGIN_ROLES[site.kind] ?? ORIGIN_ROLES.origin;
      /** @type {ContentionDescriptor[]} */
      const children = [];
      if (site.winner) {
        children.push(this.createOriginDescriptor(site.winner, CONTENTION_ICONS.winner, ORIGIN_ROLES.winner));
      }
      for (const origin of site.origins) children.push(this.createOriginDescriptor(origin, icon, role));
      const tooltip = this.getSiteTooltip(site);
      descriptors.push({ filePath: site.filePath, line: site.line, col: site.col, icon, tooltip, children });
    }

    return descriptors;
  }

  /**
   * @param {import('knip/session').ContentionOrigin} origin
   * @param {string} icon
   * @param {string} role
   * @returns {ContentionDescriptor}
   */
  createOriginDescriptor(origin, icon, role) {
    const tooltip = `${role}: ${origin.identifier}`;
    if (!path.isAbsolute(origin.filePath)) return { label: `${origin.filePath}:${origin.identifier}`, tooltip };
    return { filePath: origin.filePath, line: origin.line, col: origin.col, icon, tooltip };
  }

  /** @param {import('knip/session').ContentionSite} site */
  getSiteTooltip(site) {
    const location = `at ${this.toRelativePath(site.filePath)}: ${site.identifier}`;
    if (site.kind === 'ambiguous') return `Ambiguous ${location} resolves to ${site.origins.length} bindings`;
    if (site.kind === 'shadowed') {
      const count = site.origins.length;
      return `Shadowing ${location} hides ${count} ${count === 1 ? 'binding' : 'bindings'}`;
    }
    if (site.kind === 'converged') {
      const sources = [];
      for (const source of site.sources) sources.push(this.toRelativePath(source));
      return `Converged ${location} arrives through ${sources.join(', ')}`;
    }
    return `Contention ${location}`;
  }

  /** @param {string} filePath */
  isDescribedFile(filePath) {
    return this.currentUri ? path.relative(filePath, this.currentUri.fsPath) === '' : false;
  }

  /** @param {string} filePath */
  toRelativePath(filePath) {
    if (!this.workspaceRoot || !path.isAbsolute(filePath)) return filePath;
    return path.relative(this.workspaceRoot, filePath);
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

    const stringFields = /** @type {const} */ (['main', 'module', 'browser', 'types', 'typings']);
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
