import "@nomicfoundation/hardhat-node-test-reporter";
import "@solidstate/hardhat-contract-sizer";
import type { HardhatUserConfig } from "../../../src/plugins/hardhat/types.js";

const config: HardhatUserConfig = {
  solidity: {
    dependenciesToCompile: ["@solidstate/contracts/interfaces/IERC20.sol"],
  },
};

export default config;
