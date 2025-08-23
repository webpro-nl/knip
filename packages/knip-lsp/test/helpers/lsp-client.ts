import { type ChildProcess, spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';

/**
 * Mock LSP client for testing the server at the protocol level
 */
export class MockLSPClient extends EventEmitter {
  private process: ChildProcess | null = null;
  private messageBuffer = '';
  private nextId = 1;
  private responseHandlers = new Map<number, { resolve: (result: any) => void; reject: (error: any) => void }>();

  /**
   * Start the LSP server process
   */
  async start(serverPath: string): Promise<void> {
    this.process = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test' },
    });

    if (!this.process.stdout || !this.process.stdin) {
      throw new Error('Failed to start LSP server');
    }

    // Handle stdout (messages from server)
    this.process.stdout.on('data', (data: Buffer) => {
      this.messageBuffer += data.toString();
      this.parseMessages();
    });

    // Handle stderr (logging from server)
    this.process.stderr?.on('data', (data: Buffer) => {
      console.error('LSP Server Error:', data.toString());
    });

    this.process.on('error', error => {
      this.emit('error', error);
    });

    this.process.on('exit', code => {
      this.emit('exit', code);
    });
  }

  /**
   * Parse LSP messages from the buffer
   */
  private parseMessages(): void {
    while (true) {
      const headerEnd = this.messageBuffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) break;

      const header = this.messageBuffer.slice(0, headerEnd);
      const contentLengthMatch = header.match(/Content-Length: (\d+)/);

      if (!contentLengthMatch) {
        throw new Error('Invalid LSP message header');
      }

      const contentLength = Number.parseInt(contentLengthMatch[1], 10);
      const messageStart = headerEnd + 4;
      const messageEnd = messageStart + contentLength;

      if (this.messageBuffer.length < messageEnd) break;

      const messageContent = this.messageBuffer.slice(messageStart, messageEnd);
      this.messageBuffer = this.messageBuffer.slice(messageEnd);

      try {
        const message = JSON.parse(messageContent);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse LSP message:', error);
      }
    }
  }

  /**
   * Handle incoming messages from the server
   */
  private handleMessage(message: any): void {
    if (message.id !== undefined) {
      // Response to a request
      const handler = this.responseHandlers.get(message.id);
      if (handler) {
        if (message.error) {
          handler.reject(message.error);
        } else {
          handler.resolve(message.result);
        }
        this.responseHandlers.delete(message.id);
      }
    } else if (message.method) {
      // Notification or request from server
      this.emit('message', message);
      this.emit(message.method, message.params);
    }
  }

  /**
   * Send a request to the server and wait for response
   */
  async sendRequest(method: string, params?: any): Promise<any> {
    const id = this.nextId++;
    const message = {
      jsonrpc: '2.0',
      id,
      method,
      params: params || {},
    };

    return new Promise((resolve, reject) => {
      this.responseHandlers.set(id, { resolve, reject });
      this.sendMessage(message);
    });
  }

  /**
   * Send a notification to the server (no response expected)
   */
  sendNotification(method: string, params?: any): void {
    const message = {
      jsonrpc: '2.0',
      method,
      params: params || {},
    };
    this.sendMessage(message);
  }

  /**
   * Send a message to the server
   */
  private sendMessage(message: any): void {
    if (!this.process?.stdin) {
      throw new Error('LSP server not started');
    }

    const content = JSON.stringify(message);
    const contentLength = Buffer.byteLength(content, 'utf8');
    const header = `Content-Length: ${contentLength}\r\n\r\n`;

    this.process.stdin.write(header);
    this.process.stdin.write(content);
  }

  /**
   * Initialize the LSP connection
   */
  async initialize(rootUri: string, capabilities: any = {}): Promise<any> {
    const result = await this.sendRequest('initialize', {
      processId: process.pid,
      rootUri,
      capabilities: {
        textDocument: {
          publishDiagnostics: {
            relatedInformation: true,
          },
        },
        workspace: {
          configuration: true,
          workspaceFolders: true,
        },
        ...capabilities,
      },
      initializationOptions: {},
      workspaceFolders: [{ uri: rootUri, name: 'test' }],
    });

    // Send initialized notification
    this.sendNotification('initialized', {});

    return result;
  }

  /**
   * Wait for diagnostics for a specific file
   */
  waitForDiagnostics(uri: string, timeout = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for diagnostics for ${uri}`));
      }, timeout);

      const handler = (params: any) => {
        if (params.uri === uri) {
          clearTimeout(timer);
          this.off('textDocument/publishDiagnostics', handler);
          resolve(params);
        }
      };

      this.on('textDocument/publishDiagnostics', handler);
    });
  }

  /**
   * Collect all diagnostics within a timeout period
   * Resolves early if we receive diagnostics for expected files
   */
  async collectDiagnostics(timeout = 1000, expectedFiles = 2): Promise<Map<string, any>> {
    const diagnostics = new Map<string, any>();

    return new Promise(resolve => {
      let receivedCount = 0;
      let earlyResolveTimer: NodeJS.Timeout | null = null;

      const handler = (params: any) => {
        diagnostics.set(params.uri, params);
        receivedCount++;

        // Clear any existing early resolve timer
        if (earlyResolveTimer) {
          clearTimeout(earlyResolveTimer);
        }

        // If we've received diagnostics for expected number of files,
        // wait a short time for any stragglers then resolve
        if (receivedCount >= expectedFiles) {
          earlyResolveTimer = setTimeout(() => {
            this.off('textDocument/publishDiagnostics', handler);
            resolve(diagnostics);
          }, 100); // Short wait for any additional diagnostics
        }
      };

      this.on('textDocument/publishDiagnostics', handler);

      // Fallback timeout in case we don't get expected diagnostics
      setTimeout(() => {
        if (earlyResolveTimer) {
          clearTimeout(earlyResolveTimer);
        }
        this.off('textDocument/publishDiagnostics', handler);
        resolve(diagnostics);
      }, timeout);
    });
  }

  /**
   * Open a text document in the server
   */
  async openTextDocument(uri: string, text: string, languageId = 'typescript'): Promise<void> {
    this.sendNotification('textDocument/didOpen', {
      textDocument: {
        uri,
        languageId,
        version: 1,
        text,
      },
    });
  }

  /**
   * Shutdown the LSP server
   */
  async shutdown(): Promise<void> {
    if (!this.process) return;

    try {
      await this.sendRequest('shutdown');
      this.sendNotification('exit');

      // Give the process time to exit gracefully
      await new Promise(resolve => setTimeout(resolve, 100));
    } finally {
      if (this.process && !this.process.killed) {
        this.process.kill();
      }
      this.process = null;
    }
  }
}

/**
 * Helper to create a file URI
 */
export function fileUri(path: string): string {
  return `file://${path}`;
}
