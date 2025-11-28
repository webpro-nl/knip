import { basename, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createOptions, createSession } from 'knip/session';
import { FileChangeType, ProposedFeatures, TextDocuments } from 'vscode-languageserver';
import { CodeActionKind, createConnection } from 'vscode-languageserver/node.js';
import { TextDocument } from 'vscode-languageserver-textdocument';
import {
  createAddJSDocTagEdit,
  createDeleteFileEdit,
  createRemoveDependencyEdit,
  createRemoveExportEdit,
} from './code-action.js';
import { DEFAULT_JSDOC_TAGS, KNIP_CONFIG_LOCATIONS, REQUEST_HOVER_SNIPPETS } from './constants.js';
import { issueToDiagnostic } from './diagnostics.js';
import { getEntryPathsHoverContent, getImportedByHoverContent } from './hover.js';

const RESTART_FOR = new Set(['package.json', ...KNIP_CONFIG_LOCATIONS]);

/**
 * @import { Issues, Rules } from 'knip/session';
 * @import { Connection, Diagnostic, CodeAction } from 'vscode-languageserver';
 * @import { CodeActionParams, CodeLensParams, URI } from 'vscode-languageserver';
 * @import { Hover, HoverParams, CodeLens, DidChangeWatchedFilesParams } from 'vscode-languageserver';
 * @import { Config, HoverSnippets, IssuesByUri } from './types.js';
 *
 * @typedef {import('knip/session').Session} Session
 * @typedef {import('knip/session').File} File
 */

const FILE_CHANGE_TYPES = new Map([
  [FileChangeType.Created, 'added'],
  [FileChangeType.Deleted, 'deleted'],
  [FileChangeType.Changed, 'modified'],
]);

const ISSUE_DESC = {
  classMembers: 'class member',
  enumMembers: 'enum member',
  types: 'export keyword',
  exports: 'export keyword',
};

export class LanguageServer {
  /** @type {Connection} */
  connection;

  /** @type {undefined | string} */
  cwd;

  /** @type Set<string> */
  published = new Set();

  /** @type {undefined | Session} */
  session;

  /** @type {Rules}  */
  rules = {};

  /** @type {IssuesByUri} */
  issuesByUri = new Map();

  /** @type {Map<string, import('vscode-languageserver').Diagnostic[]>} */
  cycleDiagnostics = new Map();

  /** @type TextDocuments<TextDocument> */
  documents;

  /** @type {boolean} */
  clientSupportsExportHoverSnippets = false;

  constructor() {
    this.connection = createConnection(ProposedFeatures.all);
    this.documents = new TextDocuments(TextDocument);
    this.setupHandlers();
    this.documents.listen(this.connection);
    this.connection.listen();
  }

  setupHandlers() {
    this.connection.onInitialize(params => {
      const uri = params.workspaceFolders?.[0]?.uri;

      if (!uri) return { capabilities: {} };

      this.cwd = fileURLToPath(uri);

      const features = params.initializationOptions?.features;
      this.clientSupportsExportHoverSnippets = Boolean(features?.exportHoverSnippets);

      // Always provide all capabilities - config is checked at runtime
      const capabilities = {
        codeLensProvider: { resolveProvider: false },
        hoverProvider: true,
        codeActionProvider: {
          codeActionKinds: [CodeActionKind.QuickFix],
        },
      };

      return { capabilities };
    });

    this.connection.onInitialized(() => {});

    this.connection.onRequest('knip.start', () => this.start());

    this.connection.onRequest('knip.stop', () => this.stop());

    this.connection.onShutdown(() => this.stop());

    this.connection.onRequest('knip.restart', () => this.restart());

    this.connection.onRequest('knip.getFileNode', async params => {
      const config = await this.getConfig();
      const isShowContention = config.exports?.contention?.enabled !== false;
      return this.getFileDescriptor(fileURLToPath(params.uri), { isShowContention });
    });

    this.connection.onCodeAction(params => this.handleCodeAction(params));

    this.connection.onCodeLens(params => this.handleCodeLens(params));

    this.connection.onRequest('knip.showHover', params => this.handleHover(params));

    this.connection.onHover(params => this.handleHover(params));

    this.connection.onDidChangeWatchedFiles(params => this.handleFileChanges(params));
  }

  /** @returns {Promise<Config>} */
  async getConfig() {
    return await this.connection.workspace.getConfiguration('knip');
  }

  /**
   * @param {Issues} issues
   * @param {Config} config
   * @param {Rules} rules
   * */
  buildDiagnostics(issues, config, rules) {
    /** @type {Map<string, Diagnostic[]>} */
    const diagnostics = new Map();
    this.issuesByUri.clear();

    for (const issuesForType of Object.values(issues)) {
      for (const issuesForFile of Object.values(issuesForType)) {
        for (const issue of Object.values(issuesForFile)) {
          const uri = pathToFileURL(issue.filePath).toString();
          if (!diagnostics.has(uri)) diagnostics.set(uri, []);
          const document = this.documents.get(uri);
          const diagnostic = issueToDiagnostic(issue, rules, config, document);
          diagnostics.get(uri)?.push(diagnostic);
          if (!this.issuesByUri.has(uri)) this.issuesByUri.set(uri, new Map());
          const key = `${diagnostic.range.start.line}:${diagnostic.range.start.character}`;
          this.issuesByUri.get(uri)?.set(key, { issue, issueType: issue.type, diagnostic });
        }
      }
    }
    return diagnostics;
  }

  /** @param {Map<string, Diagnostic[]>} newDiags */
  publishDiagnostics(newDiags) {
    for (const [uri, diagnostics] of this.cycleDiagnostics) {
      const existing = newDiags.get(uri) || [];
      newDiags.set(uri, [...existing, ...diagnostics]);
    }
    for (const [uri, diagnostics] of newDiags) this.connection.sendDiagnostics({ uri, diagnostics });
    for (const uri of this.published) if (!newDiags.has(uri)) this.connection.sendDiagnostics({ uri, diagnostics: [] });
    this.published = new Set(newDiags.keys());
  }

  async start() {
    if (this.session) return;

    try {
      const config = await this.getConfig();
      if (!config?.enabled) return;

      this.connection.console.log('Creating options');
      const options = await createOptions({ cwd: this.cwd, isSession: true, isFix: true });
      this.rules = options.rules;

      this.connection.console.log('Building module graph...');
      const start = Date.now();
      const session = await createSession(options);
      this.connection.console.log(`Finished building module graph (${Date.now() - start}ms)`);

      this.session = session;
      this.publishDiagnostics(this.buildDiagnostics(session.getIssues(), config, this.rules));
    } catch (_error) {
      this.connection.console.error(`Error: ${_error}`);
    }
  }

  stop() {
    this.session = undefined;
    this.fileCache = undefined;
    for (const uri of this.published) this.connection.sendDiagnostics({ uri, diagnostics: [] });
    this.published.clear();
  }

  restart() {
    this.stop();
    this.start();
  }

  /**
   * @param {DidChangeWatchedFilesParams} params
   * @return {Promise<void>}
   */
  async handleFileChanges(params) {
    this.fileCache = undefined;
    if (!this.session) return;

    /** @type {{ type: "added" | "deleted" | "modified"; filePath: string }[]} */
    const changes = [];
    for (const change of params.changes) {
      const filePath = fileURLToPath(change.uri);
      if (RESTART_FOR.has(basename(change.uri))) return this.restart();
      const type = FILE_CHANGE_TYPES.get(change.type);
      if (!type) continue;
      changes.push({ type, filePath });
    }

    const result = await this.session.handleFileChanges(changes);

    if (result) {
      this.connection.console.log(
        `Module graph updated (${Math.floor(result.duration)}ms • ${(result.mem / 1024 / 1024).toFixed(2)}M)`
      );
    }

    const config = await this.getConfig();
    this.publishDiagnostics(this.buildDiagnostics(this.session.getIssues(), config, this.rules));
  }

  /**
   * @param {string} filePath
   * @param {{ isShowContention?: boolean }} [options]
   * @returns {File | undefined}
   */
  getFileDescriptor(filePath, options) {
    const relPath = relative(this.cwd ?? process.cwd(), filePath);
    if (!this.session) return;
    if (this.fileCache?.filePath === relPath) return this.fileCache.file;
    const startTime = performance.now();
    const file = this.session.describeFile(relPath, options);
    if (file) {
      const duration = Math.round(performance.now() - startTime);
      const mem = process.memoryUsage().heapUsed;
      this.connection.console.log(
        `Received file descriptor (${relPath} • ${duration}ms • ${(mem / 1024 / 1024).toFixed(2)}M)`
      );
      const m = file.metrics;
      this.connection.console.log(
        `  ↳ imports: ${Math.round(m.imports)}ms, exports: ${Math.round(m.exports)}ms, cycles: ${Math.round(m.cycles)}ms, contention: ${Math.round(m.contention)}ms`
      );
      this.fileCache = { filePath: relPath, file };
      return file;
    }
    this.connection.console.log(`File not in project (${relPath})`);
  }

  /**
   * @param {CodeActionParams} params
   * @returns {Promise<CodeAction[]>}
   */
  async handleCodeAction(params) {
    const config = await this.getConfig();
    if (!config.editor.exports.quickfix.enabled) return [];

    const uri = params.textDocument.uri;
    const issuesForUri = this.issuesByUri.get(uri);
    if (!issuesForUri) return [];
    const document = this.documents.get(uri);
    const jsdocTags = Array.isArray(config.editor.exports.quickfix.jsdocTags)
      ? config.editor.exports.quickfix.jsdocTags
      : DEFAULT_JSDOC_TAGS;

    /** @type {CodeAction[]} */
    const codeActions = [];

    for (const diagnostic of params.context.diagnostics) {
      if (diagnostic.source !== 'knip') continue;

      const key = `${diagnostic.range.start.line}:${diagnostic.range.start.character}`;
      const issuesForFile = issuesForUri.get(key);
      if (!issuesForFile) continue;

      const { issue, issueType } = issuesForFile;

      if (
        issueType === 'exports' ||
        issueType === 'types' ||
        issueType === 'classMembers' ||
        issueType === 'enumMembers'
      ) {
        const removeExportEdit = createRemoveExportEdit(document, uri, issue);
        if (!removeExportEdit) continue;
        codeActions.push({
          title: `Remove ${ISSUE_DESC[issueType]} (${issue.symbol})`,
          kind: CodeActionKind.QuickFix,
          diagnostics: [diagnostic],
          edit: removeExportEdit,
        });

        if (document) {
          for (const tag of jsdocTags) {
            const jsdocEdit = createAddJSDocTagEdit(document, issue, tag);
            if (!jsdocEdit) continue;
            codeActions.push({
              title: `Add ${tag} JSDoc tag`,
              kind: CodeActionKind.QuickFix,
              diagnostics: [diagnostic],
              edit: { changes: { [uri]: jsdocEdit } },
            });
          }
        }
      }

      if (issueType === 'dependencies' || issueType === 'devDependencies') {
        const removeDependencyEdit = createRemoveDependencyEdit(document, uri, issue);
        if (!removeDependencyEdit) continue;
        codeActions.push({
          title: `Remove dependency "${issue.symbol}"`,
          kind: CodeActionKind.QuickFix,
          diagnostics: [diagnostic],
          edit: removeDependencyEdit,
        });
      }

      if (issueType === 'unlisted') {
        codeActions.push({
          title: `Add '${issue.symbol}' to dependencies in package.json`,
          kind: CodeActionKind.QuickFix,
          diagnostics: [diagnostic],
        });

        codeActions.push({
          title: `Add '${issue.symbol}' to devDependencies in package.json`,
          kind: CodeActionKind.QuickFix,
          diagnostics: [diagnostic],
        });

        codeActions.push({
          title: `Add '@types/${issue.symbol}' to devDependencies in package.json`,
          kind: CodeActionKind.QuickFix,
          diagnostics: [diagnostic],
        });
      }

      if (issueType === 'files') {
        const deleteEdit = createDeleteFileEdit(uri);
        if (deleteEdit) {
          codeActions.push({
            title: `Delete this file`,
            kind: CodeActionKind.QuickFix,
            diagnostics: [diagnostic],
            edit: deleteEdit,
          });
        }
      }
    }

    return codeActions;
  }

  /**
   * @param {CodeLensParams} params
   * @returns {Promise<CodeLens[]>}
   */
  async handleCodeLens(params) {
    const config = await this.getConfig();
    if (!config.editor.exports.codelens.enabled) return [];

    const uri = params.textDocument.uri;
    const filePath = fileURLToPath(uri);

    const file = this.getFileDescriptor(filePath);
    if (!file) return [];

    const codeLenses = [];

    for (const _export of file.exports) {
      const size = _export.importLocations.length;
      if (size === 0) continue;

      const document = this.documents.get(uri);
      if (!document) continue;

      const range = {
        start: document.positionAt(_export.pos),
        end: document.positionAt(_export.pos),
      };

      codeLenses.push({
        range,
        command: {
          title: `↻ ${size} import${size > 1 ? 's' : ''}`,
          command: 'knip.showReferences',
          arguments: [uri, range.start, _export.importLocations],
        },
      });
    }

    return codeLenses;
  }

  /**
   * @param {HoverParams} params
   * @returns {Promise<Hover | null>}
   */
  async handleHover(params) {
    const config = await this.getConfig();
    if (!config.editor.exports.hover.enabled) return null;

    const root = this.cwd;
    if (!root) return null;

    const uri = params.textDocument.uri;
    const filePath = fileURLToPath(uri);

    const file = this.getFileDescriptor(filePath);
    if (!file) return null;

    const document = this.documents.get(uri);
    if (!document) return null;

    const maxSnippets = config.editor.exports.hover.maxSnippets;
    const offset = document.offsetAt(params.position);

    for (const _export of file.exports) {
      const identifier = _export.identifier;

      let isInRange = offset >= _export.pos && offset <= _export.pos + identifier.length;

      if (!isInRange && identifier === 'default' && params.position.line === _export.line - 1) {
        const lineText = document.getText({
          start: { line: _export.line - 1, character: 0 },
          end: { line: _export.line, character: 0 },
        });
        if (/export\s+default\s+/.test(lineText)) isInRange = true;
      }

      if (isInRange) {
        if (_export.importLocations.length > 0) {
          /** @type {HoverSnippets} */
          let snippets = [];
          if (maxSnippets !== 0 && this.clientSupportsExportHoverSnippets) {
            try {
              const response = await this.connection.sendRequest(REQUEST_HOVER_SNIPPETS, {
                identifier,
                locations: _export.importLocations,
                includeImportLocationSnippet: config.editor.exports.hover.includeImportLocationSnippet,
              });
              if (Array.isArray(response)) snippets = response;
            } catch (_error) {}
          }

          return getImportedByHoverContent({
            identifier,
            root,
            locations: _export.importLocations,
            snippets,
            maxSnippets,
          });
        }

        if (_export.entryPaths.size > 0) {
          return getEntryPathsHoverContent(identifier, root, _export.entryPaths, filePath);
        }

        return null;
      }
    }

    return null;
  }
}
