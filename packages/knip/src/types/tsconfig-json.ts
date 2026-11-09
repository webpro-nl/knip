export interface TsConfigJson {
  extends?: string | string[];
  compilerOptions?: {
    types?: string[];
    jsxImportSource?: string;
    plugins?: Array<string | { name: string }>;
    [key: string]: unknown;
  };
  contentMappers?: {
    package: string;
    options?: Record<string, unknown>;
  }[];
  references?: Array<{ path: string }>;
  'ts-node'?: {
    compiler?: string;
    transpiler?: string | [string, object];
    swc?: boolean;
    require?: string[];
  };
}
