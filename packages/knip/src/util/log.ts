import picocolors from 'picocolors';

export const logWarning = (prefix: string, message: string) => {
  console.warn(`${picocolors.yellow(prefix)}: ${message}`);
};

export const logError = (prefix: string, message: string) => {
  console.error(`${picocolors.red(prefix)}: ${message}`);
};
