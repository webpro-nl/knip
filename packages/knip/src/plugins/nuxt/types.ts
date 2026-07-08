export interface NuxtConfig {
  srcDir?: string;
  buildDir?: string;
  serverDir?: string;
  dir?: {
    pages?: string;
    layouts?: string;
    middleware?: string;
    plugins?: string;
    shared?: string;
  };
  modules?: Array<string | ((inlineOptions: any, nuxt: any) => any) | [string, Record<string, any>]>;
  imports?: {
    autoImport?: boolean;
    dirs?: string[];
  };
  extends?: string[];
  components?: Array<string | { path: string }> | { dirs?: Array<string | { path: string }> };
  css?: string[];
  alias?: Record<string, string>;
}
