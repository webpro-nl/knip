import { fileURLToPath } from 'node:url';

export default {
  preprocessor: fileURLToPath(new URL('./preprocessor.js', import.meta.url)),
  project: [],
};
