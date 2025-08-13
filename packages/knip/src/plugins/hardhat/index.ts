import type {
  IsPluginEnabled,
  Plugin,
  Resolve,
  ResolveConfig,
} from "../../types/config.js";
import { toDeferResolve, toDependency, toEntry } from "../../util/input.js";
import { hasDependency } from "../../util/plugin.js";
import type { HardhatUserConfig } from "./types.js";

// https://hardhat.org/docs

const title = "Hardhat";

const enablers = ["hardhat"];

const isEnabled: IsPluginEnabled = ({ dependencies }) =>
  hasDependency(dependencies, enablers);

const config = ["hardhat.config.{js,cjs,mjs,ts}"];

const resolve: Resolve = async () => {
  const inputs = [toDependency("hardhat")];

  // TODO: only add test files if a Hardhat test reporter is installed
  // TODO: get test path from config
  const patterns = [
    "**/*{.,-,_}test.?(c|m)(j|t)s",
    "**/test-*.?(c|m)(j|t)s",
    "**/test.?(c|m)(j|t)s",
    "**/test/**/*.?(c|m)(j|t)s",
  ];
  inputs.push(...patterns.map((id) => toEntry(id)));

  return inputs;
};

const resolveConfig: ResolveConfig<HardhatUserConfig> = (config) => {
  return [config.solidity]
    .flat()
    .filter(
      (solidityConfig) =>
        typeof solidityConfig !== "undefined" &&
        typeof solidityConfig !== "string",
    )
    .map((solidityConfig) => solidityConfig.dependenciesToCompile ?? [])
    .flat()
    .map((dependency) => toDeferResolve(dependency));
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolve,
  resolveConfig,
} satisfies Plugin;
