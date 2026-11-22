/* oxlint-disable no-console */
import parseArgs, { helpText, type ParsedCLIArgs } from './util/cli-arguments.ts';
import { version } from './version.ts';

let args: ParsedCLIArgs = {};

try {
  args = parseArgs();
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
    console.log(`\n${helpText}`);
    process.exit(1);
  }
  throw error;
}

if (args.help) {
  console.log(helpText);
  process.exit(0);
}

if (args.version) {
  console.log(version);
  process.exit(0);
}

const { runCLI } = await import('./run-cli.ts');
await runCLI(args);
