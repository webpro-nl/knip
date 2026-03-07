type PluginRef = string | { name: string };

type Config = {
  plugins?: PluginRef[];
};

export type OpenApiTsConfig = Config | Config[];
