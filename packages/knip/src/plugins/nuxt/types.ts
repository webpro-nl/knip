export interface NuxtConfig {
  srcDir?: string;
  dir?: {
    pages?: string;
    layouts?: string;
    middleware?: string;
  };
  modules?: Array<string>;
}
