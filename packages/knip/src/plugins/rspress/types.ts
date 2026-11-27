import type { ConfigParams, RsbuildConfig } from '../rsbuild/types.ts';

export type RspressConfig = {
  root?: string;
  themeDir?: string;
  globalStyles?: string;
  globalUIComponents?: (string | [string, Record<string, unknown>])[];
  search?:
    | false
    | {
        searchHooks?: string;
      };
  route?: {
    extensions?: string[];
    include?: string[];
    exclude?: string[];
    excludeConvention?: string[];
  };
  markdown?: {
    globalComponents?: string[];
  };
  builderConfig?: RsbuildConfig;
};

export type RspressConfigOrFn =
  | RspressConfig
  | Promise<RspressConfig>
  | ((params: ConfigParams) => RspressConfig | Promise<RspressConfig>);
