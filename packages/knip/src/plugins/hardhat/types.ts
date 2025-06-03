interface CommonSolidityUserConfig {
  dependenciesToCompile?: string[];
  // TODO: use remappings to detect imports in *.sol files
  remappings?: string[];
}

type SolidityUserConfig = string | string[] | CommonSolidityUserConfig;

export interface HardhatUserConfig {
  solidity?: SolidityUserConfig;
}
