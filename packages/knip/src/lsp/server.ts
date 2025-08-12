import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  type InitializeParams,
  TextDocumentSyncKind,
  type InitializeResult,
  CodeActionKind,
  CodeAction,
  type CodeActionParams,
  type ExecuteCommandParams,
  type DidChangeWatchedFilesParams,
  WorkspaceFolder,
  type Connection,
  DidChangeConfigurationNotification,
} from "vscode-languageserver/node.js";

import { TextDocument } from "vscode-languageserver-textdocument";

import type { ReporterOptions, Issue, IssueRecords } from "../types/issues.js";
import { toAbsolute } from "../util/path.js";
import { pathToFileURL, fileURLToPath } from "node:url";
import { main } from "../index.js";
import { runReporters } from "../util/reporter.js";
import type { CommandLineOptions } from "../types/cli.js";

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
    // Create a connection for the server using stdio
    this.connection = createConnection(
      process.stdin,
      process.stdout
    );

    // Create a simple text document manager
    this.documents = new TextDocuments(TextDocument);

    this.setupHandlers();

    // Listen on the connection
    this.documents.listen(this.connection);
    this.connection.listen();
  }

  private setupHandlers() {
    this.connection.onInitialize((params: InitializeParams) => {
      const capabilities = params.capabilities;

      // Does the client support the `workspace/configuration` request?
      this.hasConfigurationCapability = !!(
        capabilities.workspace && !!capabilities.workspace.configuration
      );
      this.hasWorkspaceFolderCapability = !!(
        capabilities.workspace && !!capabilities.workspace.workspaceFolders
      );
      this.hasDiagnosticRelatedInformationCapability = !!(
        capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation
      );

      if (params.workspaceFolders) {
        this.workspaceFolders = params.workspaceFolders;
      }

      const result: InitializeResult = {
        capabilities: {
          textDocumentSync: TextDocumentSyncKind.Incremental,
          // Tell the client that this server supports code completion
          completionProvider: {
            resolveProvider: false,
          },
          codeActionProvider: {
            codeActionKinds: [
              CodeActionKind.QuickFix,
              CodeActionKind.Source,
              CodeActionKind.SourceFixAll,
            ],
          },
          executeCommandProvider: {
            commands: [
              "knip.analyze",
              "knip.fix",
              "knip.fixAll",
              "knip.showOutput",
            ],
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
        // Register for all configuration changes
        this.connection.client.register(
          DidChangeConfigurationNotification.type,
          undefined,
        );
      }

      if (this.hasWorkspaceFolderCapability) {
        this.connection.workspace.onDidChangeWorkspaceFolders((event) => {
          this.workspaceFolders = event.added.concat(
            this.workspaceFolders.filter(
              (folder) =>
                !event.removed.some((removed) => removed.uri === folder.uri),
            ),
          );
          // Re-run analysis for new workspace folders
          this.runKnipAnalysis();
        });
      }

      // Run initial analysis
      this.runKnipAnalysis();
    });

    // Configuration change
    this.connection.onDidChangeConfiguration((change) => {
      if (this.hasConfigurationCapability) {
        // Reset all cached settings
        this.updateSettings();
      }

      // Revalidate all open text documents
      this.documents.all().forEach(this.validateTextDocument.bind(this));
    });

    // File watching
    this.connection.onDidChangeWatchedFiles(
      (params: DidChangeWatchedFilesParams) => {
        // Monitored files have changed
        const shouldReanalyze = params.changes.some((change) => {
          const filePath = fileURLToPath(change.uri);
          return (
            filePath.endsWith("package.json") ||
            filePath.endsWith("tsconfig.json") ||
            filePath.endsWith("knip.json") ||
            filePath.endsWith("knip.ts") ||
            filePath.endsWith(".knip.json") ||
            filePath.endsWith(".knip.ts")
          );
        });

        if (shouldReanalyze) {
          this.runKnipAnalysis();
        }
      },
    );

    // Document changes
    this.documents.onDidChangeContent((change) => {
      if (this.settings.runOnSave) {
        this.validateTextDocument(change.document);
      }
    });

    this.documents.onDidSave((change) => {
      if (this.settings.runOnSave) {
        // Run full analysis on save
        this.runKnipAnalysis();
      }
    });

    // Code actions
    this.connection.onCodeAction((params: CodeActionParams): CodeAction[] => {
      const actions: CodeAction[] = [];
      const textDocument = this.documents.get(params.textDocument.uri);

      if (!textDocument) {
        return actions;
      }

      const diagnostics = params.context.diagnostics;

      for (const diagnostic of diagnostics) {
        if (diagnostic.source === "knip") {
          const issueType = diagnostic.code as string;

          // Create fix action based on issue type
          if (
            issueType === "exports" ||
            issueType === "types" ||
            issueType === "nsExports" ||
            issueType === "nsTypes" ||
            issueType === "enumMembers" ||
            issueType === "classMembers"
          ) {
            actions.push({
              title: `Remove unused ${issueType}`,
              kind: CodeActionKind.QuickFix,
              diagnostics: [diagnostic],
              command: {
                title: "Fix with Knip",
                command: "knip.fix",
                arguments: [params.textDocument.uri, diagnostic],
              },
            });
          }

          if (issueType === "unlisted" || issueType === "unresolved") {
            actions.push({
              title: `Add to package.json`,
              kind: CodeActionKind.QuickFix,
              diagnostics: [diagnostic],
              command: {
                title: "Fix dependencies",
                command: "knip.fix",
                arguments: [params.textDocument.uri, diagnostic],
              },
            });
          }
        }
      }

      // Add "Fix all" action if there are multiple issues
      if (
        diagnostics.length > 1 &&
        diagnostics.some((d) => d.source === "knip")
      ) {
        actions.push({
          title: "Fix all Knip issues in file",
          kind: CodeActionKind.SourceFixAll,
          command: {
            title: "Fix all",
            command: "knip.fixAll",
            arguments: [params.textDocument.uri],
          },
        });
      }

      return actions;
    });

    // Execute command
    this.connection.onExecuteCommand(async (params: ExecuteCommandParams) => {
      switch (params.command) {
        case "knip.analyze":
          await this.runKnipAnalysis();
          break;
        case "knip.fix":
          await this.runKnipFix(params.arguments);
          break;
        case "knip.fixAll":
          await this.runKnipFixAll(params.arguments);
          break;
        case "knip.showOutput":
          this.connection.console.log("Knip analysis complete");
          break;
      }
    });
  }

  private async updateSettings() {
    if (this.hasConfigurationCapability) {
      const configuration =
        await this.connection.workspace.getConfiguration("knip");
      this.settings = {
        enableDiagnostics: configuration.enableDiagnostics ?? true,
        runOnSave: configuration.runOnSave ?? true,
        includeDevDependencies: configuration.includeDevDependencies ?? true,
        includeExports: configuration.includeExports ?? true,
        includeFiles: configuration.includeFiles ?? true,
      };
    }
  }

  private async validateTextDocument(
    textDocument: TextDocument,
  ): Promise<void> {
    // Only validate if we have results and diagnostics are enabled
    if (!this.knipResults || !this.settings.enableDiagnostics) {
      return;
    }

    const uri = textDocument.uri;
    const diagnostics = this.diagnosticsCache.get(uri) || [];

    // Send the diagnostics to the client
    this.connection.sendDiagnostics({ uri, diagnostics });
  }

  private async runKnipAnalysis(): Promise<void> {
    if (this.analysisInProgress) {
      return;
    }

    this.analysisInProgress = true;
    this.connection.console.log("Running Knip analysis...");

    try {
      // Get workspace root
      const workspaceRoot =
        this.workspaceFolders.length > 0
          ? fileURLToPath(this.workspaceFolders[0].uri)
          : process.cwd();

      // Build configuration for Knip main function
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
        isIncludeLibs: false,
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

      // Run Knip analysis directly using the main function
      const results = await main(config);
      
      // Process the results
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

      this.connection.console.log("Knip analysis complete");
    } catch (error) {
      this.connection.window.showErrorMessage(`Knip analysis failed: ${error}`);
      this.connection.console.error(`Knip analysis error: ${error}`);
    } finally {
      this.analysisInProgress = false;
    }
  }

  private async runKnipFix(args?: any[]): Promise<void> {
    try {
      const workspaceRoot =
        this.workspaceFolders.length > 0
          ? fileURLToPath(this.workspaceFolders[0].uri)
          : process.cwd();

      // Run Knip with fix mode enabled
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
        isIncludeLibs: false,
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

      this.connection.console.log("Knip fix applied");

      // Re-run analysis after fix
      await this.runKnipAnalysis();
    } catch (error) {
      this.connection.window.showErrorMessage(`Knip fix failed: ${error}`);
    }
  }

  private async runKnipFixAll(args?: any[]): Promise<void> {
    // Same as fix for now, but could be customized per file
    await this.runKnipFix(args);
  }

  public processKnipResults(options: ReporterOptions): void {
    this.knipResults = options;
    const { issues, report } = options;

    // Clear previous diagnostics
    this.diagnosticsCache.clear();

    // Helper to convert issue to diagnostic
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
            character: Math.max(
              0,
              (issue.col ?? 0) + (issue.symbol?.length ?? 1) - 1,
            ),
          },
        },
        message: this.formatDiagnosticMessage(issue, issueType),
        source: "knip",
        code: issueType,
      };

      // Add related information if available
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

    // Process each issue type
    const processIssueRecords = (records: IssueRecords, issueType: string) => {
      for (const [_, issuesForFile] of Object.entries(records)) {
        for (const [__, issue] of Object.entries(issuesForFile)) {
          const uri = pathToFileURL(toAbsolute(issue.filePath)).toString();

          if (!this.diagnosticsCache.has(uri)) {
            this.diagnosticsCache.set(uri, []);
          }

          const diagnostic = issueToDiagnostic(issue, issueType);
          this.diagnosticsCache.get(uri)!.push(diagnostic);
        }
      }
    };

    // Process all enabled issue types
    const issueTypes: Array<[keyof typeof report, keyof typeof issues]> = [
      ["dependencies", "dependencies"],
      ["devDependencies", "devDependencies"],
      ["optionalPeerDependencies", "optionalPeerDependencies"],
      ["unlisted", "unlisted"],
      ["binaries", "binaries"],
      ["unresolved", "unresolved"],
      ["exports", "exports"],
      ["types", "types"],
      ["nsExports", "nsExports"],
      ["nsTypes", "nsTypes"],
      ["duplicates", "duplicates"],
      ["enumMembers", "enumMembers"],
      ["classMembers", "classMembers"],
    ];

    for (const [reportKey, issueKey] of issueTypes) {
      if (report[reportKey]) {
        processIssueRecords(issues[issueKey] as IssueRecords, issueKey);
      }
    }

    // Send diagnostics to client
    for (const [uri, diagnostics] of this.diagnosticsCache) {
      this.connection.sendDiagnostics({ uri, diagnostics });
    }

    // Clear diagnostics for files that no longer have issues
    const allFiles = new Set(issues.files);
    for (const filePath of allFiles) {
      const uri = pathToFileURL(toAbsolute(filePath)).toString();
      if (!this.diagnosticsCache.has(uri)) {
        this.connection.sendDiagnostics({ uri, diagnostics: [] });
      }
    }
  }


  private getIssueSeverity(issueType: string): DiagnosticSeverity {
    switch (issueType) {
      case "unresolved":
        return DiagnosticSeverity.Error;
      case "unlisted":
      case "binaries":
      case "dependencies":
      case "devDependencies":
      case "optionalPeerDependencies":
        return DiagnosticSeverity.Warning;
      case "exports":
      case "types":
      case "nsExports":
      case "nsTypes":
      case "duplicates":
        return DiagnosticSeverity.Information;
      case "enumMembers":
      case "classMembers":
        return DiagnosticSeverity.Hint;
      default:
        return DiagnosticSeverity.Information;
    }
  }

  private getIssueLabel(issueType: string): string {
    switch (issueType) {
      case "dependencies":
        return "Unused dependency";
      case "devDependencies":
        return "Unused dev dependency";
      case "optionalPeerDependencies":
        return "Unused optional peer dependency";
      case "unlisted":
        return "Unlisted dependency";
      case "binaries":
        return "Unlisted binary";
      case "unresolved":
        return "Unresolved import";
      case "exports":
        return "Unused export";
      case "types":
        return "Unused type export";
      case "nsExports":
        return "Unused namespace export";
      case "nsTypes":
        return "Unused namespace type";
      case "duplicates":
        return "Duplicate export";
      case "enumMembers":
        return "Unused enum member";
      case "classMembers":
        return "Unused class member";
      default:
        return issueType;
    }
  }

  private formatDiagnosticMessage(issue: Issue, issueType: string): string {
    const label = this.getIssueLabel(issueType);
    const symbol = issue.symbol || "unknown";

    if (issue.parentSymbol) {
      return `${label}: ${issue.parentSymbol}.${symbol}`;
    }

    if (issue.specifier) {
      return `${label}: ${symbol} (from "${issue.specifier}")`;
    }

    return `${label}: ${symbol}`;
  }
}

// Create and start the language server when running in LSP mode
let server: KnipLanguageServer | null = null;

// Check if we're being run as an LSP server
const isLspMode = process.argv.includes("--lsp");

if (isLspMode) {
  server = new KnipLanguageServer();
}

// This module is only used for LSP server mode (--lsp flag)
// It's not exported as a reporter since LSP requires an interactive server
export default {};

