import assert from 'node:assert/strict';
import { writeFileSync, unlinkSync } from 'node:fs';
import { test } from 'node:test';
import { createSession } from '../../src/session/session.ts';
import type { Issues } from '../../src/types/issues.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/session');

const getUnusedFilePaths = (issues: Issues) =>
  Object.values(issues.files).flatMap(issue => Object.values(issue).map(i => i.filePath));

const cleanup = (filePaths: string[]) => {
  for (const filePath of filePaths) {
    try {
      unlinkSync(filePath);
    } catch {}
  }
};

test('ignores added file without compiler outside project glob', async () => {
  const options = await createOptions({ cwd, isSession: true });
  const session = await createSession(options);

  const cssFilePath = join(cwd, 'style.css');
  writeFileSync(cssFilePath, 'body { color: red; }');

  try {
    await session.handleFileChanges([{ type: 'added', filePath: cssFilePath }]);

    const unusedFiles = getUnusedFilePaths(session.getIssues().issues);
    assert.ok(!unusedFiles.includes(cssFilePath), 'CSS file should not be reported as unused');
  } finally {
    cleanup([cssFilePath]);
  }
});

test('reports added markdown file when compiler is enabled', async () => {
  const options = await createOptions({ cwd, isSession: true });
  const session = await createSession(options);

  const mdFilePath = join(cwd, 'notes.md');
  writeFileSync(mdFilePath, '# Notes');

  try {
    await session.handleFileChanges([{ type: 'added', filePath: mdFilePath }]);

    const unusedFiles = getUnusedFilePaths(session.getIssues().issues);
    assert.ok(unusedFiles.includes(mdFilePath), 'Markdown file with compiler should be reported as unused');
  } finally {
    cleanup([mdFilePath]);
  }
});

test('handles modified non-project files gracefully', async () => {
  const options = await createOptions({ cwd, isSession: true });
  const session = await createSession(options);

  const cssFilePath = join(cwd, 'style.css');
  writeFileSync(cssFilePath, 'body { color: red; }');

  try {
    const result = await session.handleFileChanges([{ type: 'modified', filePath: cssFilePath }]);
    assert.ok(result === undefined || typeof result === 'object', 'should not throw for non-project modified files');
  } finally {
    cleanup([cssFilePath]);
  }
});
