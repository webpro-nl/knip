import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const packagesDir = join(root, 'packages');
const packageDirs = readdirSync(packagesDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && entry.name !== 'node_modules')
  .map(entry => join('packages', entry.name));

const targets = [];
for (const packageDir of packageDirs) {
  if (packageDir !== 'packages/knip') {
    targets.push(packageDir);
    continue;
  }

  const knipChildren = readdirSync(join(root, packageDir), { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name !== 'node_modules')
    .map(entry => join(packageDir, entry.name));

  for (const target of knipChildren) {
    if (target === 'packages/knip/fixtures') {
      const fixtures = readdirSync(join(root, target), { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => join(target, entry.name));
      for (const fixture of fixtures) {
        if (fixture === 'packages/knip/fixtures/plugins') {
          const plugins = readdirSync(join(root, fixture), { withFileTypes: true })
            .filter(entry => entry.isDirectory())
            .map(entry => join(fixture, entry.name));
          targets.push(...plugins);
        } else {
          targets.push(fixture);
        }
      }
    } else {
      targets.push(target);
    }
  }
}

targets.push('scripts', 'oxlint.config.ts');

for (const target of targets) {
  const result = spawnSync('oxlint', ['--threads=1', '--disable-nested-config', '--no-error-on-unmatched-pattern', target], { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
