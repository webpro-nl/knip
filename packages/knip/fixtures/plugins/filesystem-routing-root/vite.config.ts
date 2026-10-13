import { fileRoutes } from 'filesystem-routing/vite';

export default { root: 'src', plugins: [fileRoutes({ dir: 'pages' })] };
