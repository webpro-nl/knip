import { defineConfig } from 'vite';

// https://vite.dev/config/
const isDesktop = true;
function getExtensions() {
  const extensions = ['.js', '.ts', '.tsx', '.json'];
  if (isDesktop) {
    return [...extensions.map(ext => `.desktop${ext}`), ...extensions];
  }

  return extensions;
}

export default defineConfig({
  resolve: {
    extensions: getExtensions(),
  },
});
