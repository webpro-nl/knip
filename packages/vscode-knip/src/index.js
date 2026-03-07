import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REQUEST_FILE_NODE,
  REQUEST_PACKAGE_JSON,
  REQUEST_RESTART,
  REQUEST_START,
  REQUEST_STOP,
  SESSION_LOADING,
} from '@knip/language-server/constants';
import { getErrorMessage } from '@knip/mcp/tools';
import { KNIP_CONFIG_LOCATIONS } from 'knip/session';
import * as vscode from 'vscode';
import { LanguageClient, TransportKind } from 'vscode-languageclient/node.js';
import { collectDependencySnippets } from './collect-dependency-hover-snippets.js';
import { collectExportHoverSnippets } from './collect-export-hover-snippets.js';
import { renderDependencyHover } from './render-dependency-hover.js';
import { renderExportHover, renderExportHoverEntryPaths } from './render-export-hover.js';
import { registerKnipTools, setLanguageClient, setOutputChannel } from './tools.js';
import { ExportsTreeViewProvider } from './tree-view-exports.js';
import { ImportsTreeViewProvider } from './tree-view-imports.js';

const require = createRequire(import.meta.url);

/**
 * @import { ExtensionContext, LogOutputChannel, WorkspaceFolder } from 'vscode';
 * @import { ServerOptions, LanguageClientOptions } from 'vscode-languageclient/node.js';
 * @import { PackageJson } from 'knip/session';
 * @import { TreeData } from './tree-view-base.js';
 */

/** @param {string} value */
const toPosix = value => value.split(path.sep).join(path.posix.sep);

export class Extension {
  /** @type {Extension | undefined} */
  static #instance;

  /** @type {string} */
  static #serverModule = require.resolve('@knip/language-server');

  /** @type {ExtensionContext} */
  #context;

  /** @type {Map<string, LanguageClient>} */
  #clients = new Map();

  /** @type {LogOutputChannel} */
  #outputChannel;

  /** @type {ImportsTreeViewProvider | undefined} */
  #importsProvider;

  /** @type {ExportsTreeViewProvider | undefined} */
  #exportsProvider;

  /** @type {{ dependenciesUsage: Record<string, import('knip/session').DependencyNodes> } | undefined} */
  #packageJsonCache;

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
    this.#registerHoverProvider();
    this.#registerCodeLensProvider();
    this.#setupTreeViews();
    this.#setupEventHandlers();

    // Register LM tools
    setOutputChannel(this.#outputChannel);
    registerKnipTools(this.#context);

    this.#outputChannel.info('Initializing extension');

    await this.#startClients();
    await this.#refresh();
  }

  async stop() {
    await this.#stopClients();
  }

  /**
   * @param {vscode.Uri} uri
   * @returns {LanguageClient | undefined}
   */
  #getClientForUri(uri) {
    const folder = vscode.workspace.getWorkspaceFolder(uri);
    if (!folder) return;
    return this.#clients.get(folder.uri.toString());
  }

  /**
   * @returns {LanguageClient | undefined}
   */
  #getActiveClient() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return this.#clients.values().next().value;
    return this.#getClientForUri(editor.document.uri);
  }

  async #startClients() {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders) return;

    for (const folder of folders) {
      await this.#startClientForFolder(folder);
    }

    this.#updateToolsClient();
    this.#logManagedWorkspaces();
  }

  /**
   * @param {WorkspaceFolder} folder
   */
  async #startClientForFolder(folder) {
    const key = folder.uri.toString();
    if (this.#clients.has(key)) return;

    const config = vscode.workspace.getConfiguration('knip', folder.uri);

    if (config.get('requireConfig', false)) {
      const hasConfig = await this.#hasKnipConfig(folder);
      if (!hasConfig) {
        this.#outputChannel.info(`No config found in ${folder.name}, skipping`);
        return;
      }
    }

    this.#outputChannel.info(`Starting Knip Language Server for ${folder.name}`);

    /** @type {ServerOptions} */
    const serverOptions = {
      run: { module: Extension.#serverModule, transport: TransportKind.ipc },
      debug: {
        module: Extension.#serverModule,
        transport: TransportKind.ipc,
        options: { execArgv: ['--inspect=6009'] },
      },
    };

    /** @type {LanguageClientOptions} */
    const clientOptions = {
      documentSelector: [{ scheme: 'file', pattern: `${folder.uri.fsPath}/**/*` }],
      synchronize: {
        fileEvents: [vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(folder, '**/*'))],
      },
      workspaceFolder: folder,
      initializationOptions: { config },
      outputChannel: this.#outputChannel,
      outputChannelName: 'Knip',
    };

    const client = new LanguageClient(`knip-${folder.name}`, `Knip (${folder.name})`, serverOptions, clientOptions);
    this.#clients.set(key, client);

    await client.start();
  }

  /**
   * @param {WorkspaceFolder} folder
   */
  async #stopClientForFolder(folder) {
    const key = folder.uri.toString();
    const client = this.#clients.get(key);
    if (!client) return;

    this.#outputChannel.info(`Stopping client for ${folder.name}`);
    this.#clients.delete(key);

    if (!client.needsStart()) {
      try {
        await client.sendRequest(REQUEST_STOP);
      } catch (_error) {}
    }
    if (client.needsStop()) await client.stop();
  }

  async #stopClients() {
    this.#outputChannel.info(`Stopping ${this.#clients.size} client(s)...`);
    for (const client of this.#clients.values()) {
      if (!client.needsStart()) {
        try {
          await client.sendRequest(REQUEST_STOP);
        } catch (_error) {}
      }
      if (client.needsStop()) await client.stop();
    }
    this.#clients.clear();
    setLanguageClient(undefined);
  }

  #updateToolsClient() {
    const firstClient = this.#clients.values().next().value;
    setLanguageClient(firstClient);
  }

  #logManagedWorkspaces() {
    const names = [...this.#clients.keys()].map(uri => fileURLToPath(uri));
    this.#outputChannel.info(`Managing ${this.#clients.size} workspace(s): ${names.join(', ')}`);
  }

  /**
   * Walk up directory tree to find lockfile and package.json#packageManager
   * @param {string} startDir - Starting directory path
   * @returns {string} Package manager name ('pnpm', 'yarn', or 'npm')
   * @throws {Error} If no package manager can be detected
   */
  #detectPackageManager(startDir) {
    let dir = startDir;
    const root = path.parse(dir).root;

    while (dir !== root) {
      if (existsSync(path.join(dir, 'pnpm-lock.yaml'))) return 'pnpm';
      if (existsSync(path.join(dir, 'yarn.lock'))) return 'yarn';
      if (existsSync(path.join(dir, 'package-lock.json'))) return 'npm';

      const packageJsonPath = path.join(dir, 'package.json');
      if (existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
          if (packageJson.packageManager) {
            const [pmName] = packageJson.packageManager.split('@');
            if (pmName === 'pnpm' || pmName === 'yarn' || pmName === 'npm') {
              return pmName;
            }
          }
        } catch (_error) {}
      }

      dir = path.dirname(dir);
    }

    throw new Error(
      `Could not detect package manager. Please ensure a lock file (pnpm-lock.yaml, yarn.lock, or package-lock.json) exists in your project. Current working dir: ${startDir}`
    );
  }

  #registerCommands() {
    const start = vscode.commands.registerCommand('knip.start', async () => {
      for (const client of this.#clients.values()) {
        try {
          await client.sendRequest(REQUEST_START);
        } catch (error) {
          vscode.window.showErrorMessage((error?.message || error).toString());
        }
      }
    });

    const restart = vscode.commands.registerCommand(REQUEST_RESTART, async () => {
      const client = this.#getActiveClient();
      if (!client) return;
      try {
        this.#packageJsonCache = undefined;
        await client.sendRequest(REQUEST_RESTART);
      } catch (error) {
        vscode.window.showErrorMessage((error?.message || error).toString());
      }
    });

    const showHover = vscode.commands.registerCommand('knip.showHover', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      await vscode.commands.executeCommand('editor.action.showHover');
    });

    const installDependency = vscode.commands.registerCommand(
      'knip.installDependency',
      async (packageName, dependencyType, workspacePath) => {
        try {
          if (!existsSync(workspacePath)) {
            vscode.window.showErrorMessage(`Workspace directory not found: ${workspacePath}`);
            return;
          }

          const packageManager = this.#detectPackageManager(workspacePath);
          const isDev = dependencyType === 'devDependencies';

          const commands = {
            npm: `npm install ${packageName}${isDev ? ' --save-dev' : ' --save'}`,
            pnpm: `pnpm add ${packageName}${isDev ? ' -D' : ''}`,
            yarn: `yarn add ${packageName}${isDev ? ' -D' : ''}`,
          };

          const command = commands[packageManager];
          const terminal = vscode.window.createTerminal({
            name: `Install ${packageName}`,
            cwd: workspacePath,
          });
          terminal.show();
          terminal.sendText(command);
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to install dependency: ${getErrorMessage(error)}`);
        }
      }
    );

    this.#context.subscriptions.push(start, restart, showHover, installDependency);
  }

  /**
   *
   * @param {vscode.TextDocument} document
   * @return {Promise<import('knip/session').File | typeof SESSION_LOADING | undefined>}
   */
  async #requestFileDescriptor(document) {
    const uri = document.uri.toString();
    const client = this.#getClientForUri(document.uri);
    if (!client) return;
    return await client.sendRequest(REQUEST_FILE_NODE, { uri });
  }

  #registerHoverProvider() {
    const hoverProvider = vscode.languages.registerHoverProvider(
      { scheme: 'file' },
      {
        provideHover: async (document, position) => {
          const content = await this.#getHoverContent(document, position);
          if (!content) return null;
          const md = new vscode.MarkdownString(content.value);
          md.isTrusted = true;
          return new vscode.Hover(md);
        },
      }
    );
    this.#context.subscriptions.push(hoverProvider);
  }

  #registerCodeLensProvider() {
    const codeLensProvider = vscode.languages.registerCodeLensProvider(
      { scheme: 'file' },
      /** @type {vscode.CodeLensProvider} */ ({ provideCodeLenses: this.#provideCodeLenses.bind(this) })
    );
    this.#context.subscriptions.push(codeLensProvider);
  }

  /**
   * @param {vscode.TextDocument} document
   * @param {vscode.CancellationToken} _token
   * @returns {Promise<vscode.CodeLens[] | null>}
   */
  async #provideCodeLenses(document, _token) {
    const config = vscode.workspace.getConfiguration('knip');
    if (!config.get('editor.exports.codelens.enabled', true)) return null;

    const file = await this.#requestFileDescriptor(document);
    if (!file || file === SESSION_LOADING) return null;

    /** @type {vscode.CodeLens[]} */
    const codeLenses = [];

    for (const _export of file.exports) {
      const size = _export.importLocations.length;
      if (size === 0) continue;
      const pos = document.positionAt(_export.pos);
      codeLenses.push(
        new vscode.CodeLens(new vscode.Range(pos, pos), {
          title: `↻ ${size} import${size > 1 ? 's' : ''}`,
          command: 'knip.showReferences',
          arguments: [document.uri, pos, _export.importLocations],
        })
      );
    }

    return codeLenses;
  }

  /** @param {vscode.TextEditor} [editor]  */
  async #refresh(editor) {
    const activeEditor = editor ?? vscode.window.activeTextEditor;
    if (!activeEditor) {
      this.#importsProvider?.clear('Open a file to show imports');
      this.#exportsProvider?.clear('Open a file to show exports');
      return;
    }

    const position = activeEditor.selection?.active ?? new vscode.Position(0, 0);
    const data = await this.#getFileForTreeViews(activeEditor);
    if (!data) return;
    await this.#importsProvider?.refresh(data, position);
    await this.#exportsProvider?.refresh(data, position);
  }

  /**
   * @param {vscode.TextEditor} editor
   * @returns {Promise<TreeData | undefined>}
   */
  async #getFileForTreeViews(editor) {
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

    const client = this.#getClientForUri(uri);
    if (!client) return { message: 'Language server not connected' };

    try {
      const file = await this.#requestFileDescriptor(document);
      if (file === SESSION_LOADING) return { message: '(building module graph...)' };
      if (!file) return { message: '(file not in project)' };
      return { kind: 'file', uri, file };
    } catch (error) {
      this.#outputChannel.error(`Error requesting file: ${getErrorMessage(error)}`);
      return { message: '(error requesting file)' };
    }
  }

  /**
   * @param {vscode.TextDocument} document
   * @param {vscode.Position} position
   * @returns {Promise<{ kind: 'markdown'; value: string } | null>}
   */
  async #getHoverContent(document, position) {
    const client = this.#getClientForUri(document.uri);
    if (!client) return null;

    const config = vscode.workspace.getConfiguration('knip');
    if (!config.get('editor.exports.hover.enabled', true)) return null;

    const folder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!folder) return null;
    const root = toPosix(folder.uri.fsPath);

    if (path.basename(document.uri.fsPath) === 'package.json') {
      if (!config.get('editor.dependencies.hover.enabled', true)) return null;
      return this.#getDependencyHoverContent(document, position, root, client);
    }

    const file = await this.#requestFileDescriptor(document);
    if (!file || file === SESSION_LOADING) return null;

    const _export = this.#findExportAtPosition(file, position);
    if (!_export) return null;

    const filePath = fileURLToPath(document.uri.toString());

    if (_export.importLocations.length > 0) {
      /** @type {number} */
      const maxSnippets = config.get('editor.exports.hover.maxSnippets', 3);
      /** @type {number} */
      const timeout = config.get('editor.exports.hover.timeout', 300);
      /** @type {boolean} */
      const includeImportLocationSnippet = config.get('editor.exports.hover.includeImportLocationSnippet', false);

      /** @type {import('./collect-export-hover-snippets.js').HoverSnippets} */
      let snippets = [];
      if (maxSnippets !== 0) {
        snippets = await collectExportHoverSnippets(_export.identifier, _export.importLocations, {
          timeout,
          includeImportLocationSnippet,
        });
      }

      return renderExportHover(_export, root, snippets, maxSnippets);
    }

    if (_export.entryPaths.size > 0) {
      return renderExportHoverEntryPaths(_export, filePath, root);
    }

    return null;
  }

  /**
   * @param {vscode.TextDocument} document
   * @param {vscode.Position} position
   * @param {string} root
   * @param {LanguageClient} client
   * @returns {Promise<{ kind: 'markdown'; value: string } | null>}
   */
  async #getDependencyHoverContent(document, position, root, client) {
    const packageName = this.#findDependencyAtPosition(document, position);
    if (!packageName) return null;

    try {
      if (!this.#packageJsonCache) {
        /** @type {{ dependenciesUsage: Record<string, import('knip/session').DependencyNodes> } | typeof SESSION_LOADING | undefined} */
        const result = await client.sendRequest(REQUEST_PACKAGE_JSON);
        if (!result || result === SESSION_LOADING) return null;
        this.#packageJsonCache = result;
      }

      const usage = this.#packageJsonCache.dependenciesUsage[packageName];
      if (!usage || usage.imports.length === 0) return null;

      const workspaceDir = `${toPosix(path.dirname(document.uri.fsPath))}/`;
      const imports = usage.imports.filter(_import => _import.filePath.startsWith(workspaceDir));
      if (imports.length === 0) return null;

      const snippets = await collectDependencySnippets(imports);
      return renderDependencyHover({ packageName, imports }, root, snippets);
    } catch (error) {
      this.#outputChannel.error(`Error getting dependency usage: ${getErrorMessage(error)}`);
      return null;
    }
  }

  /**
   * @param {vscode.TextDocument} document
   * @param {vscode.Position} position
   * @returns {string | undefined}
   */
  #findDependencyAtPosition(document, position) {
    const text = document.getText();
    let manifest;
    try {
      manifest = JSON.parse(text);
    } catch {
      return;
    }

    const depSections = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

    for (const section of depSections) {
      if (!manifest[section]) continue;

      const sectionRegex = new RegExp(`"${section}"\\s*:\\s*\\{`, 'g');
      const sectionMatch = sectionRegex.exec(text);
      if (!sectionMatch) continue;

      const sectionStart = sectionMatch.index;
      let braceCount = 1;
      let sectionEnd = sectionStart + sectionMatch[0].length;

      while (braceCount > 0 && sectionEnd < text.length) {
        if (text[sectionEnd] === '{') braceCount++;
        else if (text[sectionEnd] === '}') braceCount--;
        sectionEnd++;
      }

      const offset = document.offsetAt(position);
      if (offset < sectionStart || offset > sectionEnd) continue;

      for (const packageName of Object.keys(manifest[section])) {
        const packageRegex = new RegExp(`"(${packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})"\\s*:`, 'g');
        packageRegex.lastIndex = sectionStart;

        let match;
        // oxlint-disable-next-line no-cond-assign
        while ((match = packageRegex.exec(text)) !== null) {
          if (match.index > sectionEnd) break;

          const matchStart = match.index + 1;
          const matchEnd = matchStart + packageName.length;

          if (offset >= matchStart && offset <= matchEnd) {
            return packageName;
          }
        }
      }
    }
  }

  /**
   * @param {import('knip/session').File} file
   * @param {vscode.Position} position
   * @returns {import('knip/session').Export | undefined}
   */
  #findExportAtPosition(file, position) {
    for (const _export of file.exports) {
      const exportLine = _export.line - 1;
      if (position.line !== exportLine) continue;
      const col = _export.col - 1;
      const identifier = _export.identifier;
      if (identifier === 'default') return _export;
      if (position.character >= col && position.character <= col + identifier.length) return _export;
    }
  }

  /**
   * @param {vscode.WorkspaceFolder} folder
   * @returns {Promise<boolean>}
   */
  async #hasKnipConfig(folder) {
    const config = vscode.workspace.getConfiguration('knip');
    const configFile = config.get('configFilePath', '');
    const locations = configFile ? [configFile] : KNIP_CONFIG_LOCATIONS;

    for (const location of locations) {
      const candidate = vscode.Uri.joinPath(folder.uri, location);
      try {
        await vscode.workspace.fs.stat(candidate);
        return true;
      } catch (_error) {}
    }

    return false;
  }

  #setupTreeViews() {
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
      const selection = new vscode.Range(position, position);
      vscode.window.showTextDocument(uri, { selection });
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
      this.#packageJsonCache = undefined;
      this.#refresh();
    });

    const documentHandler = vscode.workspace.onDidChangeTextDocument(event => {
      const activeEditor = vscode.window.activeTextEditor;
      if (!activeEditor) return;
      if (event.document.uri.toString() !== activeEditor.document.uri.toString()) return;
      if (path.basename(event.document.uri.fsPath) !== 'package.json') return;
      this.#refresh(activeEditor);
    });

    const workspaceFoldersHandler = vscode.workspace.onDidChangeWorkspaceFolders(async event => {
      for (const folder of event.added) {
        await this.#startClientForFolder(folder);
      }
      for (const folder of event.removed) {
        await this.#stopClientForFolder(folder);
      }
      this.#updateToolsClient();
      this.#logManagedWorkspaces();
    });

    this.#context.subscriptions.push(
      selectionHandler,
      editorHandler,
      diagnosticsHandler,
      documentHandler,
      workspaceFoldersHandler
    );
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
