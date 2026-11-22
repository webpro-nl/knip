export interface BufGenConfig {
  plugins?: Array<{
    local?: string | string[];
    path?: string | string[];
    plugin?: string;
    name?: string;
  }>;
}
