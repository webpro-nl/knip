export interface TanStackRouterConfig {
  routesDirectory?: string;
  generatedRouteTree?: string;
  quoteStyle?: 'single' | 'double';
  semicolons?: boolean;
  disableTypes?: boolean;
  addExtensions?: boolean;
  disableLogging?: boolean;
  disableManifestGeneration?: boolean;
  apiBase?: string;
  routeFilePrefix?: string;
  routeFileIgnorePrefix?: string;
  routeFileIgnorePattern?: string;
  routeToken?: string;
  routeTreeFileHeader?: string[];
  routeTreeFileFooter?: string[];
  indexToken?: string;
  autoCodeSplitting?: boolean;
  experimental?: {
    enableCodeSplitting?: boolean;
  };
}
