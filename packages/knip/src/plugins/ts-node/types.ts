type TsNodeOptions = {
  compiler?: string;
  transpiler?: string | [string, object];
  swc?: boolean;
  require?: string[];
};

export type TsNodeTsConfig = {
  'ts-node'?: TsNodeOptions;
};
