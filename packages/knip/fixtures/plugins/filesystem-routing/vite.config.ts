import { fileRoutes } from 'filesystem-routing/vite';

export default {
  plugins: [fileRoutes({ types: 'src/routes.d.ts', httpMethods: true })],
};
