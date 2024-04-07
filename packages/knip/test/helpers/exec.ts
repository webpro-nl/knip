import { execSync } from 'node:child_process';
// biome-ignore lint/nursery/noRestrictedImports: ignore
import { resolve } from 'node:path';

const cliPath = resolve('dist/cli.js');

export const execFactory = (cwd: string) => {
  return (command: string) => {
    try {
      const output = execSync(command.replace(/^knip/, `node ${cliPath}`), { cwd });
      return { stdout: output.toString().trim(), stderr: '', status: 0 };
    } catch (error) {
      if (error instanceof Error && 'stdout' in error && Buffer.isBuffer(error['stdout'])) {
        return {
          stdout: error['stdout'].toString(),
          stderr: error['stderr'].toString(),
          status: error.status,
        };
      }
      // Unknown error
      throw error;
    }
  };
};
