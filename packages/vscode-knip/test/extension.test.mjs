import assert from 'node:assert/strict';
import * as vscode from 'vscode';

export async function extensionActivates() {
  const ext = vscode.extensions.getExtension('webpro.vscode-knip');
  assert.ok(ext, 'Extension should be present');
  await ext.activate();
  assert.ok(ext.isActive, 'Extension should be active');
}

export async function knipRestartCommandExists() {
  const commands = await vscode.commands.getCommands(true);
  assert.ok(commands.includes('knip.restart'), 'knip.restart command should exist');
}
