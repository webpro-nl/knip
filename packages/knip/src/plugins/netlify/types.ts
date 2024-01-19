export type PluginConfig = {
  plugins?: {
    package: string;
  }[];
  functions: {
    directory: string;
    external_node_modules: string[];
    included_files: string[];
  };
};

type ApiConfig = {
  directory?: string;
  external_node_modules?: string[];
  included_files?: string[];
  node_bundler?: string;
};

type AppConfig = ApiConfig & {
  [key: string]: ApiConfig | undefined;
};

type RecursiveAppConfig = AppConfig & {
  [key: string]: RecursiveAppConfig | undefined;
};

// Example usage
const config: RecursiveAppConfig = {
  directory: 'myfunctions/',
  external_node_modules: ['package-1'],
  included_files: ['files/*.md'],
  node_bundler: 'esbuild',
  'api_*': { external_node_modules: ['package-2'], included_files: ['!files/post-1.md'] },
  api_payment: {
    external_node_modules: ['package-3', 'package-4'],
    included_files: ['!files/post-2.md', 'package.json', 'images/**'],
  },
};

// You can use the 'config' variable with the defined type
