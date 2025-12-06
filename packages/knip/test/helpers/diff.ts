// biome-ignore-all lint/suspicious/noConsole: deal with it
import pc from 'picocolors';

export const showDiff = (actual: string, expected: string) => {
  const actualLines = actual.split('\n');
  const expectedLines = expected.split('\n');
  const maxLen = Math.max(actualLines.length, expectedLines.length);
  console.log(`\ndiff (${pc.red('-')} expected, ${pc.green('+')} actual):`);
  for (let i = 0; i < maxLen; i++) {
    const a = actualLines[i];
    const e = expectedLines[i];
    if (a === e) {
      console.log(`  ${a}`);
    } else {
      if (a !== undefined) console.log(`${pc.red('-')} ${a}`);
      if (e !== undefined) console.log(`${pc.green('+')} ${e}`);
    }
  }
  console.log();
};
