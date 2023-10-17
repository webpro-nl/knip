import { execSync } from 'node:child_process';

export const execFactory = (cwd: string, cliPath: string) => {
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
