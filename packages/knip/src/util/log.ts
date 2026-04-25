/* oxlint-disable no-console */
import st from './colors.ts';

export const logWarning = (message: string) => {
  console.warn(`${st.yellow('WARNING')}: ${message}`);
};

export const logError = (message: string) => {
  console.error(`${st.red('ERROR')}: ${message}`);
};
