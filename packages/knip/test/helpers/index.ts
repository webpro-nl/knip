import { platform } from 'node:os';

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const updatePos = (obj: any) => {
  // Add line - 1 to every pos (each EOL is one more char)
  if (platform() === 'win32') {
    if (Array.isArray(obj)) {
      for (const item of obj) updatePos(item);
    } else if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (key === 'pos' && 'line' in obj) obj[key] += obj['line'] - 1;
        else updatePos(obj[key]);
      }
    }
  }
  return obj;
};
