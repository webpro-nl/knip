import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createOptions, createSession, KNIP_CONFIG_LOCATIONS } from 'knip/session';
import { FileChangeType, ProposedFeatures, TextDocuments } from 'vscode-languageserver';
import { CodeActionKind, createConnection } from 'vscode-languageserver/node.js';
import { TextDocument } from 'vscode-languageserver-textdocument';
import {
  createAddJSDocTagEdit,
  createDeleteFileEdit,
  createRemoveDependencyEdit,
  createRemoveExportEdit,
} from './code-actions.js';
import {
  DEFAULT_JSDOC_TAGS,
  REQUEST_FILE_NODE,
  REQUEST_RESTART,
  REQUEST_RESULTS,
  REQUEST_START,
  REQUEST_STOP,
  SESSION_LOADING,
} from './constants.js';
import { issueToDiagnostic } from './diagnostics.js';

const RESTART_FOR = new Set(['package.json', ...KNIP_CONFIG_LOCATIONS]);

/** @param {string} value */
const toPosix = value => value.split(path.sep).join(path.posix.sep);

/**
 * @import { Issues, Rules } from 'knip/session';
 * @import { Connection, Diagnostic, CodeAction } from 'vscode-languageserver';
 * @import { CodeActionParams, DidChangeWatchedFilesParams } from 'vscode-languageserver';
 * @import { Config, IssuesByUri } from './types.js';
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

      const capabilities = {
        codeActionProvider: {
          codeActionKinds: [CodeActionKind.QuickFix],
        },
      };

      return { capabilities };
    });

    this.connection.onInitialized(() => {});

    this.connection.onRequest(REQUEST_START, () => this.start());

    this.connection.onRequest(REQUEST_STOP, () => this.stop());

    this.connection.onShutdown(() => this.stop());

    this.connection.onRequest(REQUEST_RESTART, () => this.restart());

    this.connection.onRequest(REQUEST_RESULTS, () => this.getResults());

    this.connection.onRequest(REQUEST_FILE_NODE, async params => {
      const config = await this.getConfig();
      const isShowContention = config.exports?.contention?.enabled !== false;
      return this.getFileDescriptor(fileURLToPath(params.uri), { isShowContention });
    });

    this.connection.onCodeAction(params => this.handleCodeAction(params));

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

      const configFilePath = config.configFilePath
        ? path.isAbsolute(config.configFilePath)
          ? config.configFilePath
          : path.resolve(this.cwd ?? process.cwd(), config.configFilePath)
        : undefined;

      if (configFilePath) {
        this.cwd = path.dirname(configFilePath);
        process.chdir(this.cwd);
      }


      this.connection.console.log('Creating options');
      const options = await createOptions({ cwd: this.cwd, isSession: true, args: { config: configFilePath } });
      this.rules = options.rules;

      this.connection.console.log('Building module graph...');
      const start = Date.now();
      const session = await createSession(options);
      this.connection.console.log(`Finished building module graph (${Date.now() - start}ms)`);

      this.session = session;
      this.publishDiagnostics(this.buildDiagnostics(session.getIssues().issues, config, this.rules));
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

  getResults() {
    if (!this.session) return null;
    return this.session.getResults();
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
      if (RESTART_FOR.has(path.basename(change.uri))) return this.restart();
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
    this.publishDiagnostics(this.buildDiagnostics(this.session.getIssues().issues, config, this.rules));
  }

  /**
   * @param {string} filePath
   * @param {{ isShowContention?: boolean }} [options]
   * @returns {File | typeof SESSION_LOADING | undefined}
   */
  getFileDescriptor(filePath, options) {
    if (!this.session) return SESSION_LOADING;
    const relPath = toPosix(path.relative(this.cwd ?? process.cwd(), filePath));
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
}
