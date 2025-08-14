import { test, expect, describe } from 'bun:test';
import { MockLSPClient, fileUri } from './helpers/lsp-client';
import path from 'node:path';

describe('Debug Diagnostics', () => {
  test('should show what diagnostics are actually generated', async () => {
    const client = new MockLSPClient();
    const serverPath = path.join(__dirname, '../dist/server.js');
    const fixtureDir = path.join(__dirname, 'fixtures/simple-project');
    const rootUri = fileUri(fixtureDir);

    await client.start(serverPath);
    await client.initialize(rootUri);

    // Wait for diagnostics
    const diagnostics = await client.collectDiagnostics(10000);

    console.log('\n=== Diagnostics Found ===');
    for (const [uri, data] of diagnostics) {
      const filename = path.basename(uri);
      console.log(`\nFile: ${filename}`);
      console.log(`Full URI: ${uri}`);
      console.log(`Number of diagnostics: ${data.diagnostics.length}`);
      
      for (const diag of data.diagnostics) {
        console.log(`  - [${diag.code}] ${diag.message}`);
        console.log(`    Severity: ${diag.severity}`);
        console.log(`    Range: ${diag.range.start.line}:${diag.range.start.character} - ${diag.range.end.line}:${diag.range.end.character}`);
      }
    }

    await client.shutdown();
    
    expect(diagnostics.size).toBeGreaterThan(0);
  }, 20000);
});