import {
  type CodeAction,
  CodeActionKind,
  type CodeActionParams,
  type Connection,
  type Diagnostic,
  DiagnosticSeverity,
  DidChangeConfigurationNotification,
  type DidChangeWatchedFilesParams,
  type ExecuteCommandParams,
  type InitializeParams,
  type InitializeResult,
  TextDocumentSyncKind,
  TextDocuments,
  type WorkspaceFolder,
  createConnection,
} from 'vscode-languageserver/node.js';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { fileURLToPath, pathToFileURL } from 'node:url';
import type { CommandLineOptions, Issue, IssueRecords, ReporterOptions } from 'knip';
import { main } from 'knip';
import { toAbsolute } from './util/path.js';

interface KnipSettings {
  enableDiagnostics: boolean;
  runOnSave: boolean;
  includeDevDependencies: boolean;
  includeExports: boolean;
  includeFiles: boolean;
}

class KnipLanguageServer {
  private connection: Connection;
  private documents: TextDocuments<TextDocument>;
  private hasConfigurationCapability = false;
  private hasWorkspaceFolderCapability = false;
  private hasDiagnosticRelatedInformationCapability = false;
  private workspaceFolders: WorkspaceFolder[] = [];
  private settings: KnipSettings = {
    enableDiagnostics: true,
    runOnSave: true,
    includeDevDependencies: true,
    includeExports: true,
    includeFiles: true,
  };
  private diagnosticsCache = new Map<string, Diagnostic[]>();
  private knipResults: ReporterOptions | null = null;
  private analysisInProgress = false;

  constructor() {
    this.connection = createConnection(process.stdin, process.stdout);
    this.documents = new TextDocuments(TextDocument);
    this.setupHandlers();
    this.documents.listen(this.connection);
    this.connection.listen();
  }

  private setupHandlers() {
    this.connection.onInitialize((params: InitializeParams) => {
      const capabilities = params.capabilities;
      this.hasConfigurationCapability = !!capabilities.workspace?.configuration;
      this.hasWorkspaceFolderCapability = !!capabilities.workspace?.workspaceFolders;
      this.hasDiagnosticRelatedInformationCapability =
        !!capabilities.textDocument?.publishDiagnostics?.relatedInformation;

      if (params.workspaceFolders) {
        this.workspaceFolders = params.workspaceFolders;
      }

      const result: InitializeResult = {
        capabilities: {
          textDocumentSync: TextDocumentSyncKind.Incremental,
          completionProvider: {
            resolveProvider: false,
          },
          codeActionProvider: {
            codeActionKinds: [CodeActionKind.QuickFix, CodeActionKind.Source, CodeActionKind.SourceFixAll],
          },
          executeCommandProvider: {
            commands: ['knip.analyze', 'knip.fix', 'knip.fixAll', 'knip.showOutput'],
          },
          workspace: {
            workspaceFolders: {
              supported: true,
              changeNotifications: true,
            },
          },
        },
      };

      if (this.hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
          workspaceFolders: {
            supported: true,
          },
        };
      }

      return result;
    });

    this.connection.onInitialized(() => {
      if (this.hasConfigurationCapability) {
        this.connection.client.register(DidChangeConfigurationNotification.type, undefined);
      }

      if (this.hasWorkspaceFolderCapability) {
        this.connection.workspace.onDidChangeWorkspaceFolders(event => {
          this.workspaceFolders = event.added.concat(
            this.workspaceFolders.filter(folder => !event.removed.some(removed => removed.uri === folder.uri))
          );
          this.runKnipAnalysis(); // re-run analysis for new workspace folders
        });
      }

      this.runKnipAnalysis(); // initial analysis
    });

    this.connection.onDidChangeConfiguration(_change => {
      if (this.hasConfigurationCapability) {
        // Reset all cached settings
        this.updateSettings();
      }

      this.documents.all().forEach(this.validateTextDocument.bind(this));
    });

    this.connection.onDidChangeWatchedFiles((params: DidChangeWatchedFilesParams) => {
      const shouldReanalyze = params.changes.some(change => {
        const filePath = fileURLToPath(change.uri);
        return (
          filePath.endsWith('package.json') ||
          filePath.endsWith('tsconfig.json') ||
          filePath.endsWith('knip.json') ||
          filePath.endsWith('knip.ts') ||
          filePath.endsWith('.knip.json') ||
          filePath.endsWith('.knip.ts')
        );
      });

      if (shouldReanalyze) {
        this.runKnipAnalysis();
      }
    });

    this.documents.onDidChangeContent(change => {
      if (this.settings.runOnSave) {
        this.validateTextDocument(change.document);
      }
    });

    this.documents.onDidSave(_change => {
      if (this.settings.runOnSave) {
        this.runKnipAnalysis();
      }
    });

    this.connection.onCodeAction((params: CodeActionParams): CodeAction[] => {
      const actions: CodeAction[] = [];
      const textDocument = this.documents.get(params.textDocument.uri);

      if (!textDocument) {
        return actions;
      }

      const diagnostics = params.context.diagnostics;

      for (const diagnostic of diagnostics) {
        if (diagnostic.source === 'knip') {
          const issueType = diagnostic.code as string;

          switch (issueType) {
            case 'exports':
            case 'types':
            case 'nsExports':
            case 'nsTypes':
            case 'enumMembers':
            case 'classMembers':
              actions.push({
                title: `Remove unused ${issueType}`,
                kind: CodeActionKind.QuickFix,
                diagnostics: [diagnostic],
                command: {
                  title: 'Fix with Knip',
                  command: 'knip.fix',
                  arguments: [params.textDocument.uri, diagnostic],
                },
              });
              break;

            case 'unlisted':
            case 'unresolved':
              actions.push({
                title: 'Add to package.json',
                kind: CodeActionKind.QuickFix,
                diagnostics: [diagnostic],
                command: {
                  title: 'Fix dependencies',
                  command: 'knip.fix',
                  arguments: [params.textDocument.uri, diagnostic],
                },
              });
              break;
          }
        }
      }

      if (diagnostics.length > 1 && diagnostics.some(d => d.source === 'knip')) {
        actions.push({
          title: 'Fix all Knip issues in file',
          kind: CodeActionKind.SourceFixAll,
          command: {
            title: 'Fix all',
            command: 'knip.fixAll',
            arguments: [params.textDocument.uri],
          },
        });
      }

      return actions;
    });

    this.connection.onExecuteCommand(async (params: ExecuteCommandParams) => {
      switch (params.command) {
        case 'knip.analyze':
          await this.runKnipAnalysis();
          break;
        case 'knip.fix':
          await this.runKnipFix(params.arguments);
          break;
        case 'knip.fixAll':
          await this.runKnipFixAll(params.arguments);
          break;
        case 'knip.showOutput':
          this.connection.console.log('Knip analysis complete');
          break;
      }
    });
  }

  private async updateSettings() {
    if (this.hasConfigurationCapability) {
      const configuration = await this.connection.workspace.getConfiguration('knip');
      this.settings = {
        enableDiagnostics: configuration.enableDiagnostics ?? true,
        runOnSave: configuration.runOnSave ?? true,
        includeDevDependencies: configuration.includeDevDependencies ?? true,
        includeExports: configuration.includeExports ?? true,
        includeFiles: configuration.includeFiles ?? true,
      };
    }
  }

  private async validateTextDocument(textDocument: TextDocument): Promise<void> {
    if (!this.knipResults || !this.settings.enableDiagnostics) {
      return;
    }

    const uri = textDocument.uri;
    const diagnostics = this.diagnosticsCache.get(uri) || [];

    this.connection.sendDiagnostics({ uri, diagnostics });
  }

  private async runKnipAnalysis(): Promise<void> {
    if (this.analysisInProgress) {
      return;
    }

    this.analysisInProgress = true;
    this.connection.console.log('Running Knip analysis...');

    try {
      const workspaceRoot =
        this.workspaceFolders.length > 0 ? fileURLToPath(this.workspaceFolders[0].uri) : process.cwd();

      const excludedIssueTypes: string[] = [];

      if (!this.settings.includeExports) {
        excludedIssueTypes.push('exports', 'nsExports', 'types', 'nsTypes');
      }

      if (!this.settings.includeFiles) {
        excludedIssueTypes.push('files');
      }

      const config: CommandLineOptions = {
        cwd: workspaceRoot,
        gitignore: true,
        isProduction: !this.settings.includeDevDependencies,
        isShowProgress: false,
        excludedIssueTypes,
        includedIssueTypes: [],
        isCache: false,
        isDebug: false,
        isDependenciesShorthand: false,
        isExportsShorthand: false,
        isFilesShorthand: false,
        isFix: false,
        isFormat: false,
        isIncludeEntryExports: false,
        isIncludeLibs: true,
        isIsolateWorkspaces: false,
        isRemoveFiles: false,
        isStrict: false,
        isWatch: false,
        tags: [[], []],
        fixTypes: [],
        cacheLocation: '',
        tsConfigFile: undefined,
        workspace: undefined,
      };

      const results = await main(config);
      this.processKnipResults({
        report: results.report,
        issues: results.issues,
        counters: results.counters,
        tagHints: results.tagHints,
        configurationHints: results.configurationHints,
        isDisableConfigHints: false,
        isTreatConfigHintsAsErrors: results.isTreatConfigHintsAsErrors,
        cwd: workspaceRoot,
        isProduction: !this.settings.includeDevDependencies,
        isShowProgress: false,
        options: '',
        preprocessorOptions: '',
        includedWorkspaces: results.includedWorkspaces,
        configFilePath: results.configFilePath,
      });

      this.connection.console.log('Knip analysis complete');
    } catch (error) {
      this.connection.window.showErrorMessage(`Knip analysis failed: ${error}`);
      this.connection.console.error(`Knip analysis error: ${error}`);
    } finally {
      this.analysisInProgress = false;
    }
  }

  private async runKnipFix(_args?: any[]): Promise<void> {
    try {
      const workspaceRoot =
        this.workspaceFolders.length > 0 ? fileURLToPath(this.workspaceFolders[0].uri) : process.cwd();

      const config: CommandLineOptions = {
        cwd: workspaceRoot,
        gitignore: true,
        isProduction: !this.settings.includeDevDependencies,
        isShowProgress: false,
        excludedIssueTypes: [],
        includedIssueTypes: [],
        isCache: false,
        isDebug: false,
        isDependenciesShorthand: false,
        isExportsShorthand: false,
        isFilesShorthand: false,
        isFix: true, // Enable fix mode
        isFormat: false,
        isIncludeEntryExports: false,
        isIncludeLibs: true,
        isIsolateWorkspaces: false,
        isRemoveFiles: false,
        isStrict: false,
        isWatch: false,
        tags: [[], []],
        fixTypes: ['dependencies', 'exports', 'types'], // Fix all fixable types
        cacheLocation: '',
        tsConfigFile: undefined,
        workspace: undefined,
      };

      await main(config);

      this.connection.console.log('Knip fix applied');

      // Re-run analysis after fix
      await this.runKnipAnalysis();
    } catch (error) {
      this.connection.window.showErrorMessage(`Knip fix failed: ${error}`);
    }
  }

  private async runKnipFixAll(args?: any[]): Promise<void> {
    await this.runKnipFix(args);
  }

  public processKnipResults(options: ReporterOptions): void {
    this.knipResults = options;
    const { issues, report } = options;

    this.diagnosticsCache.clear();

    const issueToDiagnostic = (issue: Issue, issueType: string): Diagnostic => {
      const severity = this.getIssueSeverity(issueType);

      const diagnostic: Diagnostic = {
        severity,
        range: {
          start: {
            line: Math.max(0, (issue.line ?? 1) - 1),
            character: Math.max(0, (issue.col ?? 0) - 1),
          },
          end: {
            line: Math.max(0, (issue.line ?? 1) - 1),
            character: Math.max(0, (issue.col ?? 0) + (issue.symbol?.length ?? 1) - 1),
          },
        },
        message: this.formatDiagnosticMessage(issue, issueType),
        source: 'knip',
        code: issueType,
      };

      if (this.hasDiagnosticRelatedInformationCapability && issue.specifier) {
        diagnostic.relatedInformation = [
          {
            location: {
              uri: pathToFileURL(toAbsolute(issue.filePath)).toString(),
              range: diagnostic.range,
            },
            message: `Imported from: ${issue.specifier}`,
          },
        ];
      }

      return diagnostic;
    };

    const processIssueRecords = (records: IssueRecords, issueType: string) => {
      for (const [_, issuesForFile] of Object.entries(records)) {
        for (const [__, issue] of Object.entries(issuesForFile)) {
          const uri = pathToFileURL(toAbsolute(issue.filePath)).toString();

          if (!this.diagnosticsCache.has(uri)) {
            this.diagnosticsCache.set(uri, []);
          }

          const diagnostic = issueToDiagnostic(issue, issueType);
          this.diagnosticsCache.get(uri)?.push(diagnostic);
        }
      }
    };

    const issueTypes: Array<[keyof typeof report, keyof typeof issues]> = [
      ['dependencies', 'dependencies'],
      ['devDependencies', 'devDependencies'],
      ['optionalPeerDependencies', 'optionalPeerDependencies'],
      ['unlisted', 'unlisted'],
      ['binaries', 'binaries'],
      ['unresolved', 'unresolved'],
      ['exports', 'exports'],
      ['types', 'types'],
      ['nsExports', 'nsExports'],
      ['nsTypes', 'nsTypes'],
      ['duplicates', 'duplicates'],
      ['enumMembers', 'enumMembers'],
      ['classMembers', 'classMembers'],
    ];

    for (const [reportKey, issueKey] of issueTypes) {
      if (report[reportKey]) {
        processIssueRecords(issues[issueKey] as IssueRecords, issueKey);
      }
    }

    for (const [uri, diagnostics] of this.diagnosticsCache) {
      this.connection.sendDiagnostics({ uri, diagnostics });
    }

    const allFiles = new Set(issues.files);
    for (const filePath of allFiles) {
      const uri = pathToFileURL(toAbsolute(filePath)).toString();
      if (!this.diagnosticsCache.has(uri)) {
        this.connection.sendDiagnostics({ uri, diagnostics: [] });
      }
    }
  }

  private getIssueSeverity(_issueType: string): DiagnosticSeverity {
    return DiagnosticSeverity.Warning;
  }

  private getIssueLabel(issueType: string): string {
    switch (issueType) {
      case 'dependencies':
        return 'Unused dependency';
      case 'devDependencies':
        return 'Unused dev dependency';
      case 'optionalPeerDependencies':
        return 'Unused optional peer dependency';
      case 'unlisted':
        return 'Unlisted dependency';
      case 'binaries':
        return 'Unlisted binary';
      case 'unresolved':
        return 'Unresolved import';
      case 'exports':
        return 'Unused export';
      case 'types':
        return 'Unused type export';
      case 'nsExports':
        return 'Unused namespace export';
      case 'nsTypes':
        return 'Unused namespace type';
      case 'duplicates':
        return 'Duplicate export';
      case 'enumMembers':
        return 'Unused enum member';
      case 'classMembers':
        return 'Unused class member';
      default:
        return issueType;
    }
  }

  private formatDiagnosticMessage(issue: Issue, issueType: string): string {
    const label = this.getIssueLabel(issueType);
    const symbol = issue.symbol || 'unknown';

    if (issue.parentSymbol) {
      return `${label}: ${issue.parentSymbol}.${symbol}`;
    }

    if (issue.specifier) {
      return `${label}: ${symbol} (from "${issue.specifier}")`;
    }

    return `${label}: ${symbol}`;
  }
}

const server = new KnipLanguageServer();

export { KnipLanguageServer, server as runningServer };
