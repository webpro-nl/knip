import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { findAndParseGitignores, getGitIgnoredHandler } from '../../src/util/glob-core.ts';
import { join, relative } from '../../src/util/path.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { resolve } from '../helpers/resolve.ts';

for (const gitdir of ['directory', 'relative', 'absolute']) {
  for (const commondir of ['none', 'relative', 'absolute']) {
    test(`info/exclude (gitdir: ${gitdir}, commondir: ${commondir})`, async t => {
      const root = await copyFixture('fixtures/glob-worktree/common-dir', 'knip-git-common-dir-');
      t.after(() => fs.rm(root, { recursive: true, force: true }));
      const cwd = join(root, 'checkout');
      const gitDir = gitdir === 'directory' ? join(cwd, '.git') : join(root, 'mock-git-dir');
      const commonDir = commondir === 'none' ? gitDir : join(root, 'metadata');
      if (gitdir === 'directory') {
        await fs.cp(join(root, 'mock-git-dir'), gitDir, { recursive: true });
        await fs.copyFile(join(cwd, 'commondir'), join(gitDir, 'commondir'));
      } else if (gitdir === 'relative') {
        await fs.copyFile(resolve('fixtures/glob-worktree/root/dot-git'), join(cwd, '.git'));
      } else {
        await fs.writeFile(join(cwd, '.git'), `gitdir: ${gitDir}\n`);
      }
      if (commondir === 'none') {
        await fs.rm(join(gitDir, 'commondir'));
        await fs.copyFile(join(root, 'metadata/info/exclude'), join(gitDir, 'info/exclude'));
      } else if (commondir === 'absolute') {
        await fs.writeFile(join(gitDir, 'commondir'), `${commonDir}\n`);
      }
      const excludePath = join(commonDir, 'info/exclude');
      const parsed = await findAndParseGitignores(cwd);
      assert.deepEqual(parsed.gitignoreFiles, [relative(cwd, excludePath)]);
      const isIgnored = await getGitIgnoredHandler({ cwd, gitignore: true });
      assert.equal(isIgnored(join(cwd, '.local-backups/unused.ts')), true);
      assert.equal(isIgnored(join(cwd, 'nested/.local-backups/unused.ts')), false);
      assert.equal(isIgnored(join(cwd, 'data/unused.ts')), true);
      assert.equal(isIgnored(join(cwd, 'src/data/unused.ts')), false);
      assert.equal(isIgnored(join(cwd, 'local-only.ts')), false);
    });
  }
}
