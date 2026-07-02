import childProcess from 'node:child_process';
import path from 'node:path';

const FORMATTABLE_EXTENSIONS = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.mts',
  '.cts',
  '.jsx',
  '.tsx',
  '.json',
  '.jsonc',
  '.md',
  '.mdx',
  '.yml',
  '.yaml',
  '.css',
  '.html',
]);

export function getStagedFiles(): string[] {
  const result = childProcess.spawnSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], {
    encoding: 'utf-8',
  });

  if (result.status !== 0 || !result.stdout) {
    return [];
  }

  return result.stdout
    .trim()
    .split('\n')
    .filter(file => file && FORMATTABLE_EXTENSIONS.has(path.extname(file)));
}

export function formatAndStageFiles(files: string[]): number {
  if (files.length === 0) {
    return 0;
  }

  const fmtResult = childProcess.spawnSync('pnpm', ['fmt', ...files], {
    stdio: 'inherit',
  });

  if (fmtResult.status !== 0) {
    return fmtResult.status ?? 1;
  }

  const stageResult = childProcess.spawnSync('git', ['add', ...files], {
    stdio: 'inherit',
  });

  return stageResult.status ?? 1;
}

if (process.argv[1] && import.meta.filename === process.argv[1]) {
  const stagedFiles = getStagedFiles();
  const exitCode = formatAndStageFiles(stagedFiles);
  process.exit(exitCode);
}
