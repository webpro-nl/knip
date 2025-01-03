// https://github.com/facebook/metro/blob/main/packages/metro-config/types/configTypes.d.ts

export type PluginConfig = {
  projectRoot?: string;
  transformerPath?: string;
  transformer?: {
    minifierPath?: string;
    assetPlugins?: string[];
    babelTransformerPath?: string;
  };
};
