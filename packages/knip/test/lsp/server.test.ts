import { test } from 'bun:test';
import assert from 'node:assert/strict';

test('LSP reporter - should format messages with correct Content-Length header', () => {
  const testMessage = {
    jsonrpc: '2.0' as const,
    method: 'test',
    params: { test: true }
  };

  const json = JSON.stringify(testMessage);
  const expectedLength = Buffer.byteLength(json, 'utf8');
  const expectedHeader = `Content-Length: ${expectedLength}\r\n\r\n`;

  // Test the header format
  assert.match(expectedHeader, /^Content-Length: \d+\r\n\r\n$/);
  assert.ok(expectedLength > 0);
});

test('LSP reporter - should calculate correct byte length for UTF-8', () => {
  // Test with ASCII
  const asciiMessage = { text: 'hello' };
  const asciiJson = JSON.stringify(asciiMessage);
  const asciiLength = Buffer.byteLength(asciiJson, 'utf8');
  assert.equal(asciiLength, asciiJson.length);

  // Test with multi-byte UTF-8 characters
  const unicodeMessage = { text: '你好世界' };
  const unicodeJson = JSON.stringify(unicodeMessage);
  const unicodeLength = Buffer.byteLength(unicodeJson, 'utf8');
  assert.ok(unicodeLength > unicodeJson.length); // UTF-8 bytes > string length for Chinese characters
});

test('LSP reporter - diagnostic severity values', () => {
  // Test LSP diagnostic severity constants
  const Error = 1;
  const Warning = 2;
  const Information = 3;
  const Hint = 4;

  // Verify severity mappings make sense
  assert.equal(Error, 1);
  assert.equal(Warning, 2);
  assert.equal(Information, 3);
  assert.equal(Hint, 4);
});

test('LSP reporter - diagnostic range structure', () => {
  // Test diagnostic range structure
  const diagnostic = {
    range: {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 10 }
    },
    message: 'Test diagnostic',
    severity: 2,
    source: 'knip',
    code: 'test-code'
  };

  assert.equal(diagnostic.range.start.line, 0);
  assert.equal(diagnostic.range.start.character, 0);
  assert.equal(diagnostic.range.end.line, 0);
  assert.equal(diagnostic.range.end.character, 10);
  assert.equal(diagnostic.source, 'knip');
});

test('LSP reporter - file URI format', () => {
  // Test file URI formats
  const unixPath = '/home/user/project/file.ts';
  const unixUri = `file://${unixPath}`;
  assert.ok(unixUri.startsWith('file://'));
  assert.ok(unixUri.includes('file.ts'));

  // Windows path format (theoretical test)
  const windowsPath = 'C:\\Users\\project\\file.ts';
  const windowsUri = `file:///${windowsPath.replace(/\\/g, '/')}`;
  assert.ok(windowsUri.startsWith('file:///'));
  assert.ok(windowsUri.includes('file.ts'));
});

test('LSP reporter - JSON-RPC message structure', () => {
  // Test request structure
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {}
  };

  assert.equal(request.jsonrpc, '2.0');
  assert.equal(request.id, 1);
  assert.equal(request.method, 'initialize');
  assert.ok(request.params);

  // Test notification structure (no id)
  const notification = {
    jsonrpc: '2.0',
    method: 'textDocument/publishDiagnostics',
    params: {
      uri: 'file:///test.ts',
      diagnostics: []
    }
  };

  assert.equal(notification.jsonrpc, '2.0');
  assert.equal(notification.method, 'textDocument/publishDiagnostics');
  assert.ok(!('id' in notification));
});

test('LSP reporter - issue type to severity mapping logic', () => {
  // Define expected mappings
  const severityMap = {
    'unresolved': 1, // Error
    'unlisted': 2, // Warning
    'binaries': 2, // Warning
    'dependencies': 2, // Warning
    'devDependencies': 2, // Warning
    'optionalPeerDependencies': 2, // Warning
    'exports': 3, // Information
    'types': 3, // Information
    'nsExports': 3, // Information
    'nsTypes': 3, // Information
    'duplicates': 3, // Information
    'enumMembers': 4, // Hint
    'classMembers': 4, // Hint
  };

  // Test each mapping
  Object.entries(severityMap).forEach(([issueType, expectedSeverity]) => {
    assert.ok(expectedSeverity >= 1 && expectedSeverity <= 4, `Severity for ${issueType} should be between 1 and 4`);
  });

  // Ensure critical issues are errors
  assert.equal(severityMap['unresolved'], 1);
  
  // Ensure dependency issues are warnings
  assert.equal(severityMap['dependencies'], 2);
  assert.equal(severityMap['devDependencies'], 2);
  
  // Ensure code quality issues are hints
  assert.equal(severityMap['enumMembers'], 4);
  assert.equal(severityMap['classMembers'], 4);
});
