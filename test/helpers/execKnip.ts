import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from '../../src/util/path.js';

const thisFileUrl = fileURLToPath(import.meta.url);

const cliPath = resolve(
  thisFileUrl,
  // Needed if run in the /tmp (like in the npm test script) to find the correct dist folder
  thisFileUrl.endsWith('tmp/test/helpers/execKnip.js') ? '..' : '.',
  '../../../dist/cli.js'
);

export const execFactory = (cwd: string) => {
  return (command: string) => {
    try {
      const output = execSync(command.replace(/^knip/, `node ${cliPath}`), { cwd });
      return output.toString().trim();
    } catch (error) {
      if (error instanceof Error && 'stdout' in error && Buffer.isBuffer(error['stdout'])) {
        return error['stdout'].toString();
      }
      // Unknown error
      throw error;
    }
  };
};
