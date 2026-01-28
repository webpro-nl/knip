import { readFileSync, writeFileSync } from 'node:fs';
import { glob } from 'tinyglobby';
import { dirname, join } from '../src/util/path.js';

const FIXTURES_DIR = join(process.cwd(), 'fixtures');

function renderTree(tree: Record<string, any>, prefix = ''): string[] {
  const lines: string[] = [];
  const entries = Object.entries(tree).sort(([a], [b]) => a.localeCompare(b));
  for (const [key, value] of entries) {
    const isLast = key === entries.at(-1)[0];
    lines.push(
      `${prefix}${isLast ? '└── ' : '├── '}${tree[key]._name ? `${key} (${tree[key]._name})` : key}`,
      ...renderTree(value, prefix + (isLast ? '    ' : '│   '))
    );
  }
  return lines;
}

async function main(isFix = false) {
  const filePaths = await glob('**/package.json', {
    cwd: FIXTURES_DIR,
    ignore: ['**/node_modules/**'],
  });

  const tree = {};
  const issues: [string, string, string][] = [];
  const fixed: string[] = [];

  for (const filePath of filePaths) {
    const absPath = join(FIXTURES_DIR, filePath);
    const parts = dirname(filePath).split('/');
    const expectedName =
      parts.at(0) === 'plugins'
        ? `@plugins/${parts.at(1)}${parts.length > 2 ? `__${parts.at(-1)}` : ''}`
        : `@fixtures/${parts.at(0)}${parts.length > 1 ? `__${parts.at(-1)}` : ''}`;

    if (parts.at(0) !== 'plugins') {
      if (expectedName.includes('__')) tree[parts.at(0)][parts.at(-1)] = {};
      else tree[parts.at(0)] = {};
    }

    const pkg = JSON.parse(readFileSync(absPath, 'utf8'));
    const name = pkg.name;

    if (name && !name.startsWith('x-') && !name.includes('/x-') && !name.includes('-x-') && name !== expectedName) {
      issues.push([filePath, expectedName, name ?? '(unnamed)']);
      if (isFix) {
        pkg.name = expectedName;
        writeFileSync(absPath, `${JSON.stringify(pkg, null, 2)}\n`);
        fixed.push(filePath);
      }
    }
  }

  console.log('.');
  console.log(renderTree(tree).join('\n'));

  if (issues.length) {
    process.exitCode = 1;
    console.log('\nIssues:');
    for (const issue of issues) console.log(`${issue[0]}: Expected "${issue[1]}", got "${issue[2]}"`);

    if (isFix) {
      console.log('\nFixed:');
      for (const file of fixed) console.log(`- ${file}`);
    } else console.log('\nRun with --fix to update package names');
  } else {
    process.exitCode = 0;
    console.log('\n✅ All good');
  }
}

main(process.argv.includes('--fix'));
