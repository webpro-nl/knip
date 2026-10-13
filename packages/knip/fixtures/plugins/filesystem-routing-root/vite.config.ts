import { fileRoutes } from 'filesystem-routing/vite';
import type { UserConfig } from 'vite';

export default { root: 'src', plugins: [fileRoutes({ dir: 'pages' })] } satisfies UserConfig;
