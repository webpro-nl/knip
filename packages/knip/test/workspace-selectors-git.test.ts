import assert from 'node:assert/strict';
import { execSync, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import test from 'node:test';
import { main } from '../src/index.js';
import { join } from '../src/util/path.js';
import { createOptions } from './helpers/create-options.js';

const isGitAvailable = () => {
  const result = spawnSync('git', ['--version'], { stdio: 'ignore' });
  return !result.error && result.status === 0;
};

const testCwd = join(process.cwd(), 'test-tmp-git-workspace');

// Only run tests if git is available
if (isGitAvailable()) {
  test('Git selector: select workspaces with changes', async () => {
    // Setup: Create a temporary git repo with workspaces
    rmSync(testCwd, { recursive: true, force: true });
    mkdirSync(testCwd, { recursive: true });

    // Initialize git repo
    execSync('git init', { cwd: testCwd, stdio: 'ignore' });
    execSync('git config user.email "test@example.com"', { cwd: testCwd, stdio: 'ignore' });
    execSync('git config user.name "Test User"', { cwd: testCwd, stdio: 'ignore' });

    // Create root package.json with workspaces
    writeFileSync(
      join(testCwd, 'package.json'),
      JSON.stringify({
        name: 'test-monorepo',
        workspaces: ['packages/*'],
      })
    );

    // Create workspace A
    mkdirSync(join(testCwd, 'packages/a'), { recursive: true });
    writeFileSync(join(testCwd, 'packages/a/package.json'), JSON.stringify({ name: '@test/a' }));
    writeFileSync(join(testCwd, 'packages/a/index.js'), 'export const a = 1;');

    // Create workspace B
    mkdirSync(join(testCwd, 'packages/b'), { recursive: true });
    writeFileSync(join(testCwd, 'packages/b/package.json'), JSON.stringify({ name: '@test/b' }));
    writeFileSync(join(testCwd, 'packages/b/index.js'), 'export const b = 1;');

    // Initial commit
    execSync('git add .', { cwd: testCwd, stdio: 'ignore' });
    execSync('git commit -m "Initial commit"', { cwd: testCwd, stdio: 'ignore' });

    // Modify only workspace A
    writeFileSync(join(testCwd, 'packages/a/index.js'), 'export const a = 2;');
    execSync('git add .', { cwd: testCwd, stdio: 'ignore' });
    execSync('git commit -m "Update workspace A"', { cwd: testCwd, stdio: 'ignore' });

    // Test: Select workspaces with changes since HEAD~1
    const options = await createOptions({
      cwd: testCwd,
      workspace: '[HEAD~1]',
    });

    const { counters, includedWorkspaceDirs, selectedWorkspaces } = await main(options);

    assert(counters.processed > 0);
    assert(selectedWorkspaces?.includes('packages/a'));
    assert(!selectedWorkspaces?.includes('packages/b'));
    assert(includedWorkspaceDirs.includes(join(testCwd, 'packages/a')));
    assert(!includedWorkspaceDirs.includes(join(testCwd, 'packages/b')));

    // Cleanup
    rmSync(testCwd, { recursive: true, force: true });
  });

  test('Git selector: no changes returns empty selection', async () => {
    // Setup
    rmSync(testCwd, { recursive: true, force: true });
    mkdirSync(testCwd, { recursive: true });

    execSync('git init', { cwd: testCwd, stdio: 'ignore' });
    execSync('git config user.email "test@example.com"', { cwd: testCwd, stdio: 'ignore' });
    execSync('git config user.name "Test User"', { cwd: testCwd, stdio: 'ignore' });

    writeFileSync(join(testCwd, 'package.json'), JSON.stringify({ name: 'test-monorepo', workspaces: ['packages/*'] }));

    mkdirSync(join(testCwd, 'packages/a'), { recursive: true });
    writeFileSync(join(testCwd, 'packages/a/package.json'), JSON.stringify({ name: '@test/a' }));
    writeFileSync(join(testCwd, 'packages/a/index.js'), 'export const a = 1;');

    execSync('git add .', { cwd: testCwd, stdio: 'ignore' });
    execSync('git commit -m "Initial commit"', { cwd: testCwd, stdio: 'ignore' });

    // Test: No changes since HEAD
    const options = await createOptions({
      cwd: testCwd,
      workspace: '[HEAD]',
    });

    const { counters, selectedWorkspaces } = await main(options);

    assert.deepEqual(selectedWorkspaces, []);
    assert.equal(counters.processed, 0);
    assert.equal(counters.total, 0);

    // Cleanup
    rmSync(testCwd, { recursive: true, force: true });
  });

  test('Git selector: invalid ref throws error', async () => {
    // Setup minimal repo
    rmSync(testCwd, { recursive: true, force: true });
    mkdirSync(testCwd, { recursive: true });

    execSync('git init', { cwd: testCwd, stdio: 'ignore' });
    execSync('git config user.email "test@example.com"', { cwd: testCwd, stdio: 'ignore' });
    execSync('git config user.name "Test User"', { cwd: testCwd, stdio: 'ignore' });

    writeFileSync(join(testCwd, 'package.json'), JSON.stringify({ name: 'test-monorepo', workspaces: [] }));

    execSync('git add .', { cwd: testCwd, stdio: 'ignore' });
    execSync('git commit -m "Initial"', { cwd: testCwd, stdio: 'ignore' });

    // Test: Invalid ref should throw
    const options = await createOptions({
      cwd: testCwd,
      workspace: '[nonexistent-ref-12345]',
    });
    await assert.rejects(
      async () => {
        await main(options);
      },
      (error: Error) => {
        return error.message.includes('Git') || error.message.includes('ref');
      }
    );

    // Cleanup
    rmSync(testCwd, { recursive: true, force: true });
  });

  test('Git selector: root changes select root workspace', async () => {
    rmSync(testCwd, { recursive: true, force: true });
    mkdirSync(testCwd, { recursive: true });

    execSync('git init', { cwd: testCwd, stdio: 'ignore' });
    execSync('git config user.email "test@example.com"', { cwd: testCwd, stdio: 'ignore' });
    execSync('git config user.name "Test User"', { cwd: testCwd, stdio: 'ignore' });

    writeFileSync(join(testCwd, 'package.json'), JSON.stringify({ name: 'test-monorepo', workspaces: ['packages/*'] }));
    writeFileSync(join(testCwd, 'root.js'), 'export const root = 1;');

    mkdirSync(join(testCwd, 'packages/a'), { recursive: true });
    writeFileSync(join(testCwd, 'packages/a/package.json'), JSON.stringify({ name: '@test/a' }));
    writeFileSync(join(testCwd, 'packages/a/index.js'), 'export const a = 1;');

    execSync('git add .', { cwd: testCwd, stdio: 'ignore' });
    execSync('git commit -m "Initial commit"', { cwd: testCwd, stdio: 'ignore' });

    writeFileSync(join(testCwd, 'root.js'), 'export const root = 2;');
    execSync('git add .', { cwd: testCwd, stdio: 'ignore' });
    execSync('git commit -m "Update root"', { cwd: testCwd, stdio: 'ignore' });

    const options = await createOptions({
      cwd: testCwd,
      workspace: '[HEAD~1]',
    });

    const { selectedWorkspaces } = await main(options);
    assert(selectedWorkspaces?.includes('.'));

    rmSync(testCwd, { recursive: true, force: true });
  });
} else {
  test.skip('Git selector tests skipped: git not available', () => {});
}
