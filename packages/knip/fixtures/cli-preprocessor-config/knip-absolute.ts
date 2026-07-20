import { fileURLToPath } from 'node:url';

export default {
  preprocessor: fileURLToPath(new URL('./absolute-preprocessor.js', import.meta.url)),
};
