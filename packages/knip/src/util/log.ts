/* oxlint-disable no-console */
import st from './colors.ts';

export const logWarning = (prefix: string, message: string) => {
  console.warn(`${st.yellow(prefix)}: ${message}`);
};

export const logError = (prefix: string, message: string) => {
  console.error(`${st.red(prefix)}: ${message}`);
};
