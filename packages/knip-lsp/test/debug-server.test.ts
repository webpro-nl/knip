import { test, expect, describe } from 'bun:test';
import { spawn } from 'node:child_process';
import path from 'node:path';

describe('Debug LSP Server', () => {
  test('should start and respond to initialize', async () => {
    const serverPath = path.join(__dirname, '../dist/server.js');
    const fixtureDir = path.join(__dirname, 'fixtures/simple-project');
    
    console.log('Starting server at:', serverPath);
    console.log('Fixture dir:', fixtureDir);
    
    const proc = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let output = '';
    let errorOutput = '';
    
    proc.stdout?.on('data', (data) => {
      output += data.toString();
      console.log('Server stdout:', data.toString());
    });
    
    proc.stderr?.on('data', (data) => {
      errorOutput += data.toString();
      console.log('Server stderr:', data.toString());
    });

    // Send initialize request
    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        processId: process.pid,
        rootUri: `file://${fixtureDir}`,
        capabilities: {},
        workspaceFolders: [{ uri: `file://${fixtureDir}`, name: 'test' }],
      },
    };

    const content = JSON.stringify(initRequest);
    const header = `Content-Length: ${Buffer.byteLength(content, 'utf8')}\r\n\r\n`;
    
    console.log('Sending:', header + content);
    proc.stdin?.write(header);
    proc.stdin?.write(content);

    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Total output:', output);
    console.log('Total error output:', errorOutput);

    proc.kill();
    
    expect(output).toContain('jsonrpc');
  });
});