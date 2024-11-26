import { TanStackRouterRspack } from '@tanstack/router-plugin/rspack';

export default {
  tools: {
    rspack: {
      plugins: [TanStackRouterRspack()],
    },
  },
};
