import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { ISSUE_TYPES } from 'knip/session';
import { DiagnosticSeverity, DiagnosticTag } from 'vscode-languageserver/node';
import { issueToDiagnostic } from '../src/diagnostics.js';

const manifest = JSON.parse(readFileSync(new URL('../../vscode-knip/package.json', import.meta.url), 'utf8'));
const editorSettings = manifest.contributes.configuration.find(section => section.title === 'Editor').properties;

const dimSettings = Object.keys(editorSettings)
  .filter(key => key.includes('.highlight.dim'))
  .map(key => key.slice(key.lastIndexOf('.') + 1));

const toIssueType = setting => setting.replace(/^dim/, '').replace(/^./, first => first.toLowerCase());

const NO_DIM = Object.fromEntries(dimSettings.map(setting => [setting, false]));

/**
 * @param {unknown} [severity]
 * @param {Record<string, boolean>} [highlight]
 */
const config = (severity, highlight = NO_DIM) => ({ editor: { severity, exports: { highlight } } });

const rules = { exports: 'error', types: 'warn', files: 'error', enumMembers: 'error', duplicates: 'error' };

const unusedExport = { type: 'exports', symbol: 'unusedThing', line: 3, col: 14, filePath: '/project/module.ts' };
const unusedType = { ...unusedExport, type: 'types' };
const unusedFile = { type: 'files', symbol: 'unused.ts', filePath: '/project/unused.ts' };

const document = { getText: () => '' };

const severityOf = (issue, cfg, doc) => issueToDiagnostic(issue, rules, cfg, doc).severity;

test('severity follows the rules by default', () => {
  assert.equal(severityOf(unusedExport, config('default')), DiagnosticSeverity.Error);
  assert.equal(severityOf(unusedType, config('default')), DiagnosticSeverity.Warning);
});

test('severity falls back to the rules when a client sends no setting', () => {
  assert.equal(severityOf(unusedExport, config(undefined)), DiagnosticSeverity.Error);
});

test('a scalar applies to every issue type', () => {
  assert.equal(severityOf(unusedExport, config('warning')), DiagnosticSeverity.Warning);
  assert.equal(severityOf(unusedType, config('information')), DiagnosticSeverity.Information);
  assert.equal(severityOf(unusedFile, config('hint'), document), DiagnosticSeverity.Hint);
});

test('a scalar raises issue types the rules made a warning', () => {
  assert.equal(severityOf(unusedType, config('error')), DiagnosticSeverity.Error);
});

test('downgrade and upgrade step relative to the rules', () => {
  assert.equal(severityOf(unusedExport, config('downgrade')), DiagnosticSeverity.Warning);
  assert.equal(severityOf(unusedType, config('downgrade')), DiagnosticSeverity.Information);
  assert.equal(severityOf(unusedType, config('upgrade')), DiagnosticSeverity.Error);
});

test('downgrade and upgrade stop at the ends of the scale', () => {
  assert.equal(severityOf(unusedExport, config('upgrade')), DiagnosticSeverity.Error);
  assert.equal(severityOf(unusedFile, config({ files: 'hint' }), document), DiagnosticSeverity.Hint);
  assert.equal(severityOf(unusedFile, config({ files: 'downgrade' }), document), DiagnosticSeverity.Hint);
});

test('a map keyed by issue type beats the wildcard', () => {
  const cfg = config({ '*': 'hint', exports: 'error' });

  assert.equal(severityOf(unusedExport, cfg), DiagnosticSeverity.Error);
  assert.equal(severityOf(unusedType, cfg), DiagnosticSeverity.Hint);
});

test('the wildcard alone covers every issue type', () => {
  const cfg = config({ '*': 'warning' });

  assert.equal(severityOf(unusedExport, cfg), DiagnosticSeverity.Warning);
  assert.equal(severityOf(unusedType, cfg), DiagnosticSeverity.Warning);
});

test('issue types absent from a map follow the rules', () => {
  const cfg = config({ exports: 'hint' });

  assert.equal(severityOf(unusedType, cfg), DiagnosticSeverity.Warning);
});

test('unused files are information by default', () => {
  assert.equal(severityOf(unusedFile, config('default'), document), DiagnosticSeverity.Information);
  assert.equal(severityOf(unusedFile, config({ '*': 'warning' }), document), DiagnosticSeverity.Warning);
});

test('a hint fades the code, whichever value produced it', () => {
  for (const severity of ['hint', { exports: 'hint' }, { '*': 'hint' }]) {
    const diagnostic = issueToDiagnostic(unusedExport, rules, config(severity));

    assert.equal(diagnostic.severity, DiagnosticSeverity.Hint);
    assert.deepEqual(diagnostic.tags, [DiagnosticTag.Unnecessary]);
  }
});

test('every contributed dim setting names a real issue type, and dims it', () => {
  assert.ok(dimSettings.length > 0, 'no dim settings found in the extension manifest');

  for (const setting of dimSettings) {
    const type = toIssueType(setting);
    assert.ok(ISSUE_TYPES.includes(type), `${setting} names "${type}", which is not a Knip issue type`);

    const issue = { ...unusedExport, type };
    const diagnostic = issueToDiagnostic(issue, rules, config('default', { ...NO_DIM, [setting]: true }));

    assert.equal(diagnostic.severity, DiagnosticSeverity.Hint, setting);
  }
});

test('a dim setting still dims, and beats the wildcard', () => {
  const cfg = config({ '*': 'error' }, { ...NO_DIM, dimExports: true });
  const diagnostic = issueToDiagnostic(unusedExport, rules, cfg);

  assert.equal(diagnostic.severity, DiagnosticSeverity.Hint);
  assert.deepEqual(diagnostic.tags, [DiagnosticTag.Unnecessary]);
});

test('an entry for the issue type beats a dim setting', () => {
  const cfg = config({ exports: 'error' }, { ...NO_DIM, dimExports: true });

  assert.equal(severityOf(unusedExport, cfg), DiagnosticSeverity.Error);
});

test('a diagnostic carries the position and description of its issue', () => {
  const diagnostic = issueToDiagnostic(unusedExport, rules, config('default'));

  assert.deepEqual(diagnostic.range, {
    start: { line: 2, character: 13 },
    end: { line: 2, character: 24 },
  });
  assert.equal(diagnostic.message, 'Unused export: unusedThing');
  assert.equal(diagnostic.source, 'knip');
  assert.equal(diagnostic.code, 'exports');
  assert.equal(diagnostic.tags, undefined);
});

test('an unused file is reported at the top of the file', () => {
  const diagnostic = issueToDiagnostic(unusedFile, rules, config('default'), document);

  assert.deepEqual(diagnostic.range, {
    start: { line: 0, character: 0 },
    end: { line: 0, character: 1 },
  });
  assert.equal(diagnostic.message, 'Unused file');
});
