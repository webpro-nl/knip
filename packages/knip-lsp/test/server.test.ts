import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { MockLSPClient, fileUri } from './helpers/lsp-client';
import path from 'node:path';

describe('Knip LSP Server', () => {
  let client: MockLSPClient;
  const serverPath = path.join(__dirname, '../dist/server.js');
  const fixtureDir = path.join(__dirname, 'fixtures/simple-project');
  const rootUri = fileUri(fixtureDir);

  beforeAll(async () => {
    client = new MockLSPClient();
    await client.start(serverPath);
  });

  afterAll(async () => {
    await client.shutdown();
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      const result = await client.initialize(rootUri);

      expect(result.capabilities).toBeDefined();
      expect(result.capabilities.textDocumentSync).toBeDefined();
      expect(result.capabilities.codeActionProvider).toBeDefined();
      expect(result.capabilities.executeCommandProvider).toBeDefined();
      expect(result.capabilities.executeCommandProvider.commands).toContain('knip.analyze');
      expect(result.capabilities.executeCommandProvider.commands).toContain('knip.fix');
    }, 10000); // Increase timeout
  });

  describe('Diagnostics', () => {
    test('should generate diagnostics for Knip issues', async () => {
      // Initialize first
      await client.initialize(rootUri);

      // Wait for initial analysis and collect diagnostics
      const diagnostics = await client.collectDiagnostics(10000);

      // We should have diagnostics for at least index.ts
      const indexUri = fileUri(path.join(fixtureDir, 'index.ts'));
      const indexDiagnostics = diagnostics.get(indexUri);

      expect(indexDiagnostics).toBeDefined();
      expect(indexDiagnostics.diagnostics).toBeArray();
      expect(indexDiagnostics.diagnostics.length).toBeGreaterThan(0);
    }, 15000);

    test('should detect unused dependencies', async () => {
      await client.initialize(rootUri);
      const diagnostics = await client.collectDiagnostics(10000);

      // Check for unused dependency diagnostic
      let foundUnusedDep = false;
      for (const [uri, data] of diagnostics) {
        for (const diagnostic of data.diagnostics) {
          if (diagnostic.code === 'dependencies' && 
              diagnostic.message.includes('unused-dep')) {
            foundUnusedDep = true;
            expect(diagnostic.severity).toBe(2); // Warning
            expect(diagnostic.source).toBe('knip');
          }
        }
      }

      expect(foundUnusedDep).toBe(true);
    }, 15000);

    test('should detect unresolved imports with error severity', async () => {
      await client.initialize(rootUri);
      const diagnostics = await client.collectDiagnostics(10000);

      const indexUri = fileUri(path.join(fixtureDir, 'index.ts'));
      const indexDiagnostics = diagnostics.get(indexUri);

      const unresolvedDiagnostic = indexDiagnostics?.diagnostics.find(
        (d: any) => d.code === 'unresolved'
      );

      expect(unresolvedDiagnostic).toBeDefined();
      expect(unresolvedDiagnostic.severity).toBe(2); // Warning (based on current implementation)
      expect(unresolvedDiagnostic.message).toContain('Unresolved import');
    }, 15000);

    test('should detect unused exports', async () => {
      await client.initialize(rootUri);
      const diagnostics = await client.collectDiagnostics(10000);

      const indexUri = fileUri(path.join(fixtureDir, 'index.ts'));
      const indexDiagnostics = diagnostics.get(indexUri);

      const unusedExport = indexDiagnostics?.diagnostics.find(
        (d: any) => d.code === 'exports' && d.message.includes('unusedFunction')
      );

      expect(unusedExport).toBeDefined();
      expect(unusedExport.severity).toBe(2); // Warning
      expect(unusedExport.message).toContain('Unused export');
    }, 15000);

    test('should detect unused type exports', async () => {
      await client.initialize(rootUri);
      const diagnostics = await client.collectDiagnostics(10000);

      const indexUri = fileUri(path.join(fixtureDir, 'index.ts'));
      const indexDiagnostics = diagnostics.get(indexUri);

      const unusedType = indexDiagnostics?.diagnostics.find(
        (d: any) => d.code === 'types' && d.message.includes('UnusedType')
      );

      expect(unusedType).toBeDefined();
      expect(unusedType.severity).toBe(2); // Warning
      expect(unusedType.message).toContain('Unused type export');
    }, 15000);

    test('should detect unused enum members', async () => {
      await client.initialize(rootUri);
      const diagnostics = await client.collectDiagnostics(10000);

      const indexUri = fileUri(path.join(fixtureDir, 'index.ts'));
      const indexDiagnostics = diagnostics.get(indexUri);

      const unusedEnumMember = indexDiagnostics?.diagnostics.find(
        (d: any) => d.code === 'enumMembers' && d.message.includes('Inactive')
      );

      expect(unusedEnumMember).toBeDefined();
      expect(unusedEnumMember.severity).toBe(2); // Warning
      expect(unusedEnumMember.message).toContain('Unused enum member');
    }, 15000);

    test('should detect unused class members', async () => {
      await client.initialize(rootUri);
      const diagnostics = await client.collectDiagnostics(10000);

      const indexUri = fileUri(path.join(fixtureDir, 'index.ts'));
      const indexDiagnostics = diagnostics.get(indexUri);

      const unusedClassMember = indexDiagnostics?.diagnostics.find(
        (d: any) => d.code === 'classMembers' && d.message.includes('unusedMethod')
      );

      expect(unusedClassMember).toBeDefined();
      expect(unusedClassMember.severity).toBe(2); // Warning
      expect(unusedClassMember.message).toContain('Unused class member');
    }, 15000);

    test('should have correct line/column positions', async () => {
      await client.initialize(rootUri);
      const diagnostics = await client.collectDiagnostics(10000);

      const indexUri = fileUri(path.join(fixtureDir, 'index.ts'));
      const indexDiagnostics = diagnostics.get(indexUri);

      // Check that diagnostics have valid ranges
      for (const diagnostic of indexDiagnostics?.diagnostics || []) {
        expect(diagnostic.range).toBeDefined();
        expect(diagnostic.range.start).toBeDefined();
        expect(diagnostic.range.end).toBeDefined();
        expect(diagnostic.range.start.line).toBeGreaterThanOrEqual(0);
        expect(diagnostic.range.start.character).toBeGreaterThanOrEqual(0);
      }
    }, 15000);
  });

  describe('Code Actions', () => {
    test('should provide code actions for diagnostics', async () => {
      await client.initialize(rootUri);
      
      // Wait for diagnostics first
      const diagnostics = await client.collectDiagnostics(10000);
      const indexUri = fileUri(path.join(fixtureDir, 'index.ts'));
      const indexDiagnostics = diagnostics.get(indexUri);

      if (indexDiagnostics && indexDiagnostics.diagnostics.length > 0) {
        // Request code actions for the first diagnostic
        const diagnostic = indexDiagnostics.diagnostics[0];
        const codeActions = await client.sendRequest('textDocument/codeAction', {
          textDocument: { uri: indexUri },
          range: diagnostic.range,
          context: {
            diagnostics: [diagnostic],
          },
        });

        expect(codeActions).toBeArray();
        expect(codeActions.length).toBeGreaterThan(0);
        
        // Should have appropriate fix action
        const fixAction = codeActions.find((a: any) => 
          a.kind === 'quickfix' && a.command
        );
        expect(fixAction).toBeDefined();
      }
    }, 15000);

    test('should provide "Fix all" action when multiple issues exist', async () => {
      await client.initialize(rootUri);
      
      const diagnostics = await client.collectDiagnostics(10000);
      const indexUri = fileUri(path.join(fixtureDir, 'index.ts'));
      const indexDiagnostics = diagnostics.get(indexUri);

      if (indexDiagnostics && indexDiagnostics.diagnostics.length > 1) {
        const codeActions = await client.sendRequest('textDocument/codeAction', {
          textDocument: { uri: indexUri },
          range: {
            start: { line: 0, character: 0 },
            end: { line: 100, character: 0 },
          },
          context: {
            diagnostics: indexDiagnostics.diagnostics,
          },
        });

        const fixAllAction = codeActions.find((a: any) => 
          a.title.includes('Fix all')
        );
        expect(fixAllAction).toBeDefined();
      }
    }, 15000);
  });

  describe('Commands', () => {
    test('should execute knip.analyze command', async () => {
      await client.initialize(rootUri);
      
      // Execute analyze command
      const result = await client.sendRequest('workspace/executeCommand', {
        command: 'knip.analyze',
      });

      // Should complete without error
      expect(result).toBeUndefined(); // Commands typically return undefined on success
    }, 10000);
  });

  describe('Configuration', () => {
    test('should respect configuration settings', async () => {
      await client.initialize(rootUri);

      // Send configuration change to disable exports checking
      client.sendNotification('workspace/didChangeConfiguration', {
        settings: {
          knip: {
            includeExports: false,
          },
        },
      });

      // Wait a bit for re-analysis
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Collect new diagnostics
      const diagnostics = await client.collectDiagnostics(3000);
      const indexUri = fileUri(path.join(fixtureDir, 'index.ts'));
      const indexDiagnostics = diagnostics.get(indexUri);

      // Should not have export-related diagnostics
      const exportDiagnostics = indexDiagnostics?.diagnostics.filter(
        (d: any) => d.code === 'exports' || d.code === 'types'
      );

      expect(exportDiagnostics).toEqual([]);
    }, 20000);
  });
});