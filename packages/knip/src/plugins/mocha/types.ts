export interface MochaConfig {
  file?: string | string[];
  import?: string | string[];
  loader?: string | string[];
  'node-option'?: string | string[];
  reporter?: string;
  require?: string | string[];
  spec?: string | string[];
}
