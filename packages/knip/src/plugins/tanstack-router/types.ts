import { z } from 'zod';

export const tanstackRouterPluginConfigSchema = z
  .object({
    routeFilePrefix: z.string().optional(),
    routeFileIgnorePrefix: z.string().optional().default('-'),
    routeFileIgnorePattern: z.string().optional(),
    routesDirectory: z.string().default('./src/routes'),
    generatedRouteTree: z.string().default('./src/routeTree.gen.ts'),
  })
  .default({
    routesDirectory: './src/routes',
    generatedRouteTree: './src/routeTree.gen.ts',
    routeFileIgnorePrefix: '-',
  });

export type TanstackRouterPluginConfig = z.infer<typeof tanstackRouterPluginConfigSchema>;
