import { defineConfig, sharpImageService } from 'astro/config';

export default defineConfig({
  image: {
    service: sharpImageService(),
  },
});
