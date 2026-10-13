import { fileRoutes } from 'filesystem-routing/vite';

export default { plugins: [fileRoutes({ dir: 'src/pages' })] };
