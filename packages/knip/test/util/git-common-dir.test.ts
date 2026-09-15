import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { findAndParseGitignores, getGitIgnoredHandler } from '../../src/util/glob-core.ts';
import { join, relative, toPosix } from '../../src/util/path.ts';

for (const gitdir of ['directory', 'relative', 'absolute']) {
  for (const commondir of ['none', 'relative', 'absolute']) {
    test(`info/exclude (gitdir: ${gitdir}, commondir: ${commondir})`, async t => {
      const root = toPosix(await fs.mkdtemp(join(toPosix(tmpdir()), 'knip-git-common-dir-')));
      t.after(() => fs.rm(root, { recursive: true, force: true }));
      const cwd = join(root, 'checkout');
      const gitDir = gitdir === 'directory' ? join(cwd, '.git') : join(root, 'metadata/worktrees/linked');
      const commonDir = commondir === 'none' ? gitDir : join(root, 'metadata');
      await fs.mkdir(cwd, { recursive: true });
      await fs.mkdir(gitDir, { recursive: true });
      await fs.mkdir(join(commonDir, 'info'), { recursive: true });
      if (gitdir !== 'directory') {
        await fs.writeFile(join(cwd, '.git'), `gitdir: ${gitdir === 'absolute' ? gitDir : relative(cwd, gitDir)}\n`);
      }
      if (commondir !== 'none') {
        await fs.writeFile(
          join(gitDir, 'commondir'),
          `${commondir === 'absolute' ? commonDir : relative(gitDir, commonDir)}\n`
        );
        await fs.mkdir(join(gitDir, 'info'), { recursive: true });
        await fs.writeFile(join(gitDir, 'info/exclude'), '/local-only.ts\n');
      }
      const excludePath = join(commonDir, 'info/exclude');
      await fs.writeFile(excludePath, '/.local-backups/\n');
      const parsed = await findAndParseGitignores(cwd);
      assert.deepEqual(parsed.gitignoreFiles, [relative(cwd, excludePath)]);
      const isIgnored = await getGitIgnoredHandler({ cwd, gitignore: true });
      assert.equal(isIgnored(join(cwd, '.local-backups/unused.ts')), true);
      assert.equal(isIgnored(join(cwd, 'nested/.local-backups/unused.ts')), false);
      assert.equal(isIgnored(join(cwd, 'local-only.ts')), false);
    });
  }
}
