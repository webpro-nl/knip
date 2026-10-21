import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, realpathSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import posix from 'node:path/posix';
import win32 from 'node:path/win32';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import {
  artifactFiles,
  expectedRevision,
  manifestName,
  nativeDirectory,
  packageDirectory,
  releaseTargets,
  validateArtifacts,
} from './native-artifacts.js';

const path = process.platform === 'win32' ? win32 : posix;
export function collectArtifacts({
  from,
  run,
  revision = expectedRevision(),
  destination = nativeDirectory,
  source,
  execute = spawnSync,
}) {
  const options = { strict: true, required: releaseTargets, revision, source };
  let temporary;
  try {
    let directory = from;
    if (!directory && run) {
      if (!/^\d+$/.test(run)) throw new Error('KNIP_NATIVE_RUN_ID must be a GitHub Actions run ID');
      const details = execute('gh', ['run', 'view', run, '--json', 'status,conclusion'], {
        cwd: packageDirectory,
        encoding: 'utf8',
      });
      if (details.error) throw details.error;
      if (details.status !== 0) throw new Error(details.stderr || 'Could not inspect native artifact workflow');
      const workflow = JSON.parse(details.stdout);
      if (workflow.status !== 'completed' || workflow.conclusion !== 'success') {
        throw new Error('Native artifacts must come from a successful workflow run.');
      }
      temporary = mkdtempSync(path.join(tmpdir(), 'knip-native-artifacts-'));
      const result = execute('gh', ['run', 'download', run, '--name', `knip-native-${revision}`, '--dir', temporary], {
        cwd: packageDirectory,
        stdio: 'inherit',
      });
      if (result.error) throw result.error;
      if (result.status !== 0) throw new Error('Native artifact download failed');
      directory = temporary;
    }
    if (!directory) throw new Error('Set KNIP_NATIVE_RUN_ID or KNIP_NATIVE_ARTIFACTS to collect release artifacts.');
    if (realpathSync(directory) === realpathSync(destination)) {
      throw new Error('Collect release artifacts from a separate staging directory, not the build output directory.');
    }
    validateArtifacts({ ...options, directory });
    for (const target of releaseTargets) {
      for (const name of [...artifactFiles(target), manifestName(target)]) {
        const output = path.join(destination, name);
        const staged = `${output}.${process.pid}.tmp`;
        copyFileSync(path.join(directory, name), staged);
        renameSync(staged, output);
      }
    }
    validateArtifacts({ ...options, directory: destination });
  } finally {
    if (temporary) rmSync(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({
    options: { from: { type: 'string' }, run: { type: 'string' }, revision: { type: 'string' } },
  });
  const revision = values.revision || expectedRevision();
  collectArtifacts({
    from: values.from || process.env.KNIP_NATIVE_ARTIFACTS,
    run: values.run || process.env.KNIP_NATIVE_RUN_ID,
    revision,
  });
  console.log(`Collected all ${releaseTargets.length} native targets from ${revision}.`);
}
