export interface NitroConfig {
  srcDir?: string;
  apiDir?: string;
  routesDir?: string;
  modules?: Array<string | ((inlineOptions: any, nitro: any) => any) | [string, Record<string, any>]>;
}
