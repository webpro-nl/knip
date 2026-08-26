export interface OpenClawManifest {
  assetScripts?: {
    build?: string;
    copy?: string;
  };
  build?: {
    staticAssets?: { source?: string }[];
  };
  channel?: {
    configuredState?: { specifier?: string };
    persistedAuthState?: { specifier?: string };
  };
  extensions?: string | string[];
  hooks?: string[];
  providerCatalogEntry?: string;
  runtimeExtensions?: string | string[];
  setupEntry?: string;
  runtimeSetupEntry?: string;
}
