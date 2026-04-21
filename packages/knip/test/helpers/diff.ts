/* oxlint-disable no-console */
import st from '../../src/util/colors.ts';

export const showDiff = (actual: string, expected: string) => {
  const actualLines = actual.split('\n');
  const expectedLines = expected.split('\n');
  const maxLen = Math.max(actualLines.length, expectedLines.length);
  console.log(`\ndiff (${st.red('-')} expected, ${st.green('+')} actual):`);
  for (let i = 0; i < maxLen; i++) {
    const a = actualLines[i];
    const e = expectedLines[i];
    if (a === e) {
      console.log(`  ${a}`);
    } else {
      if (a !== undefined) console.log(`${st.red('-')} ${a}`);
      if (e !== undefined) console.log(`${st.green('+')} ${e}`);
    }
  }
  console.log();
};
