import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { KNIP_CONFIG_LOCATIONS, REQUEST_HOVER_SNIPPETS } from '@knip/language-server/constants';
import * as vscode from 'vscode';
import { LanguageClient, TransportKind } from 'vscode-languageclient/node.js';
import { collectExportHoverSnippets } from './hover-snippets.js';
import { ExportsTreeViewProvider } from './tree-view-exports.js';
import { ImportsTreeViewProvider } from './tree-view-imports.js';

/**
 * @import { ExtensionContext, LogOutputChannel } from 'vscode';
 * @import { ServerOptions, LanguageClientOptions } from 'vscode-languageclient/node.js';
 * @import { PackageJson } from 'knip/session';
 * @import { TreeData } from './tree-view-base.js';
 */

export class Extension {
  /** @type {Extension | undefined} */
  static #instance;

  /** @type {ExtensionContext} */
  #context;

  /** @type {LanguageClient | undefined} */
  #client;

  /** @type {LogOutputChannel} */
  #outputChannel;

  /** @type {ImportsTreeViewProvider | undefined} */
  #importsProvider;

  /** @type {ExportsTreeViewProvider | undefined} */
  #exportsProvider;

  /**
   * @param {ExtensionContext} context
   */
  constructor(context) {
    this.#context = context;
    this.#outputChannel = vscode.window.createOutputChannel('Knip', { log: true });
  }

  /**
   * @param {ExtensionContext} context
   * @returns {Extension}
   */
  static create(context) {
    Extension.#instance ??= new Extension(context);
    return Extension.#instance;
  }

  async init() {
    this.#registerCommands();
    this.#setupTreeView();
    this.#setupEventHandlers();

    const config = vscode.workspace.getConfiguration('knip');

    const isEnabled = config.get('enabled', true);
    this.#outputChannel.info(`Extension enabled: ${isEnabled}`);
    if (!isEnabled) return;

    if (config.get('requireConfig', false)) {
      const hasConfig = await this.#hasKnipConfig();
      this.#outputChannel.info(`Config file found: ${hasConfig}`);
      if (!hasConfig) return;
    }

    this.#outputChannel.info('Initializing extension');

    await this.#startClient();
    await this.#client?.sendRequest('knip.start');
    await this.#refresh();
  }

  async stop() {
    await this.#stopClient();
  }

  async #startClient() {
    if (this.#client && !this.#client.needsStart()) return;

    if (!this.#client) {
      const config = vscode.workspace.getConfiguration('knip');
      const module = fileURLToPath(import.meta.resolve('@knip/language-server'));

      this.#outputChannel.info('Starting Knip Language Server');

      /** @type {ServerOptions} */
      const serverOptions = {
        run: { module, transport: TransportKind.ipc },
        debug: { module, transport: TransportKind.ipc, options: { execArgv: ['--inspect=6009'] } },
      };

      /** @type {LanguageClientOptions} */
      const clientOptions = {
        documentSelector: [{ scheme: 'file' }],
        synchronize: { fileEvents: [vscode.workspace.createFileSystemWatcher('**/*')] },
        initializationOptions: { config, features: { exportHoverSnippets: true } },
        outputChannel: this.#outputChannel,
        outputChannelName: 'Knip',
      };

      this.#client = new LanguageClient('knip', 'Knip', serverOptions, clientOptions);

      this.#client.onRequest(REQUEST_HOVER_SNIPPETS, async payload => {
        try {
          return await collectExportHoverSnippets(payload);
        } catch (_error) {
          return [];
        }
      });
    }

    await this.#client.start();
  }

  async #stopClient() {
    if (!this.#client) return;
    if (!this.#client.needsStart()) {
      try {
        await this.#client.sendRequest('knip.stop');
      } catch (_error) {}
    }
    if (this.#client.needsStop()) await this.#client.stop();
  }

  #registerCommands() {
    const restart = vscode.commands.registerCommand('knip.restart', async () => {
      if (!this.#client) return;
      try {
        await this.#client.sendRequest('knip.restart');
      } catch (error) {
        vscode.window.showErrorMessage((error?.message || error).toString());
      }
    });

    const showHover = vscode.commands.registerCommand('knip.showHover', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || !this.#client) return;
      const position = editor.selection.active;
      try {
        const uri = editor.document.uri.toString();
        const hoverParams = { textDocument: { uri }, position };
        const hover = await this.#client.sendRequest('knip.showHover', hoverParams);
        if (hover?.contents?.value) vscode.window.showInformationMessage(hover.contents.value, { modal: true });
      } catch (error) {
        vscode.window.showErrorMessage((error?.message || error).toString());
      }
    });

    this.#context.subscriptions.push(restart, showHover);
  }

  /** @param {vscode.TextEditor} [editor]  */
  async #refresh(editor) {
    const activeEditor = editor ?? vscode.window.activeTextEditor;
    if (!activeEditor) {
      this.#importsProvider?.clear('Open a file to inspect imports');
      this.#exportsProvider?.clear('Open a file to inspect exports');
      return;
    }

    const position = activeEditor.selection?.active ?? new vscode.Position(0, 0);
    const data = await this.#getTreeDataForEditor(activeEditor);
    if (!data) return;
    await this.#importsProvider?.refresh(data, position);
    await this.#exportsProvider?.refresh(data, position);
  }

  /**
   * @param {vscode.TextEditor} editor
   * @returns {Promise<TreeData | undefined>}
   */
  async #getTreeDataForEditor(editor) {
    const document = editor.document;
    const uri = document.uri;

    if (uri.scheme !== 'file') return;

    if (path.basename(uri.fsPath) === 'package.json') {
      /** @type {undefined | PackageJson} */
      let contents;
      try {
        contents = JSON.parse(document.getText());
      } catch {}
      if (!contents) return { message: '(error retrieving file)' };
      return { kind: 'manifest', uri, manifest: contents };
    }

    if (!this.#client) {
      return { message: 'Language server not connected' };
    }

    const requestUri = uri.toString();
    try {
      const file = await this.#client.sendRequest('knip.getFileNode', { uri: requestUri });
      if (!file) return { message: '(file not in project)' };
      return { kind: 'file', uri, file };
    } catch (error) {
      this.#outputChannel.error(`Error requesting file: ${(error?.message || error).toString()}`);
      return { message: '(error requesting file)' };
    }
  }

  async #hasKnipConfig() {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) return false;

    for (const location of KNIP_CONFIG_LOCATIONS) {
      const candidate = vscode.Uri.joinPath(folder.uri, location);
      try {
        await vscode.workspace.fs.stat(candidate);
        return true;
      } catch (_error) {}
    }

    return false;
  }

  #setupTreeView() {
    this.#importsProvider = new ImportsTreeViewProvider();
    const importsView = vscode.window.createTreeView('knip.imports', {
      treeDataProvider: this.#importsProvider,
      showCollapseAll: true,
    });
    this.#importsProvider.setTreeView(importsView);
    this.#context.subscriptions.push(importsView);

    this.#exportsProvider = new ExportsTreeViewProvider();
    const exportsView = vscode.window.createTreeView('knip.exports', {
      treeDataProvider: this.#exportsProvider,
      showCollapseAll: true,
    });
    this.#exportsProvider.setTreeView(exportsView);
    this.#context.subscriptions.push(exportsView);

    const goToPosition = vscode.commands.registerCommand('knip.goToPosition', (uri, line, col) => {
      const position = new vscode.Position(line, col);
      const range = new vscode.Range(position, position);
      vscode.window.showTextDocument(uri, { selection: range });
    });

    const showReferences = vscode.commands.registerCommand('knip.showReferences', (uri, position, importLocations) => {
      const locations = importLocations.map(location => {
        const pos = new vscode.Position(location.line ? location.line - 1 : 0, location.col ? location.col - 1 : 0);
        return new vscode.Location(vscode.Uri.file(location.filePath), pos);
      });
      const vsPosition = new vscode.Position(position.line, position.character);
      vscode.commands.executeCommand('editor.action.showReferences', vscode.Uri.parse(uri), vsPosition, locations);
    });

    const expandAll = vscode.commands.registerCommand('knip.expandAll', () => {
      const expand = async provider => {
        const treeViewLocal = provider?.treeView;
        if (!treeViewLocal) return;

        const expandNode = async element => {
          try {
            await treeViewLocal.reveal(element, { expand: true, focus: false, select: false });
            const children = await provider?.getChildren(element);
            if (children?.length) {
              for (const child of children) {
                await expandNode(child);
              }
            }
          } catch (_error) {}
        };

        const sections = await provider?.getChildren(undefined);
        if (!sections?.length) return;

        for (const section of sections) {
          await expandNode(section);
        }

        try {
          await treeViewLocal.reveal(sections[0], { expand: true, focus: false, select: false });
        } catch (_error) {}
      };

      expand(this.#importsProvider);
      expand(this.#exportsProvider);
    });

    this.#context.subscriptions.push(goToPosition, showReferences, expandAll);
  }

  #setupEventHandlers() {
    const selectionHandler = vscode.window.onDidChangeTextEditorSelection(event => {
      if (event.textEditor === vscode.window.activeTextEditor) {
        const activeSelection = event.selections[0]?.active;
        if (activeSelection) {
          this.#importsProvider?.updatePosition(activeSelection);
          this.#exportsProvider?.updatePosition(activeSelection);
        }
      }
    });

    const editorHandler = vscode.window.onDidChangeActiveTextEditor(editor => {
      this.#refresh(editor);
    });

    const diagnosticsHandler = vscode.languages.onDidChangeDiagnostics(() => {
      this.#refresh();
    });

    const documentHandler = vscode.workspace.onDidChangeTextDocument(event => {
      const activeEditor = vscode.window.activeTextEditor;
      if (!activeEditor) return;
      if (event.document.uri.toString() !== activeEditor.document.uri.toString()) return;
      if (path.basename(event.document.uri.fsPath) !== 'package.json') return;
      this.#refresh(activeEditor);
    });

    this.#context.subscriptions.push(selectionHandler, editorHandler, diagnosticsHandler, documentHandler);
  }
}

/** @type {Extension | undefined} */
let instance;

/** @param {ExtensionContext} context */
export async function activate(context) {
  instance = Extension.create(context);
  await instance.init();
}

export async function deactivate() {
  await instance?.stop();
}
