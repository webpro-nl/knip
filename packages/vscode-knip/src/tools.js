import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { REQUEST_RESULTS } from '@knip/language-server/constants';
import { buildResults, ERROR_HINT, getDocs, getResults } from '@knip/mcp/tools';
import { KNIP_CONFIG_LOCATIONS } from 'knip/session';
import * as vscode from 'vscode';

/**
 * @import { ExtensionContext } from 'vscode';
 * @import { LanguageClient } from 'vscode-languageclient/node.js';
 */

/** @type {LanguageClient | undefined} */
let languageClient;

/**
 * @param {LanguageClient | undefined} client
 */
export function setLanguageClient(client) {
  languageClient = client;
}

/**
 * @param {string} cwd
 */
function findKnipConfig(cwd) {
  for (const location of KNIP_CONFIG_LOCATIONS) {
    const filePath = join(cwd, location);
    if (existsSync(filePath)) return filePath;
  }
}

/** @implements {vscode.LanguageModelTool<{ topic: string }>} */
class KnipDocsTool {
  /**
   * @param {vscode.LanguageModelToolInvocationOptions<{ topic: string }>} options
   * @param {vscode.CancellationToken} _token
   * @returns {Promise<vscode.LanguageModelToolResult>}
   */
  async invoke(options, _token) {
    const result = getDocs(options.input.topic);
    const text = 'content' in result ? result.content : result.error;
    return new vscode.LanguageModelToolResult([new vscode.LanguageModelTextPart(text)]);
  }
}

/** @implements {vscode.LanguageModelTool<{ cwd?: string }>} */
class KnipConfigureTool {
  /**
   * @param {vscode.LanguageModelToolInvocationOptions<{ cwd?: string }>} options
   * @param {vscode.CancellationToken} _token
   * @returns {Promise<vscode.LanguageModelToolResult>}
   */
  async invoke(options, _token) {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      const cwd = options.input.cwd || workspaceFolder?.uri.fsPath || process.cwd();

      let result;
      const configFilePath = findKnipConfig(cwd);

      if (configFilePath && languageClient && !languageClient.needsStart()) {
        try {
          const results = await languageClient.sendRequest(REQUEST_RESULTS);
          if (results) result = buildResults(results, { cwd, configFilePath });
        } catch {}
      }

      if (!result) result = await getResults(cwd);

      return new vscode.LanguageModelToolResult([new vscode.LanguageModelTextPart(JSON.stringify(result))]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const result = { error: message, hint: ERROR_HINT };
      return new vscode.LanguageModelToolResult([new vscode.LanguageModelTextPart(JSON.stringify(result))]);
    }
  }
}

const configureTool = new KnipConfigureTool();
const docsTool = new KnipDocsTool();

/**
 * @param {ExtensionContext} context
 */
export function registerKnipTools(context) {
  context.subscriptions.push(vscode.lm.registerTool('knip-configure', configureTool));
  context.subscriptions.push(vscode.lm.registerTool('knip-docs', docsTool));
}
