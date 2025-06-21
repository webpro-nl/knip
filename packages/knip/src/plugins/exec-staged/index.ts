import type {
  IsPluginEnabled,
  Plugin,
  ResolveConfig,
} from "../../types/config.js";
import type { Input } from "../../util/input.js";
import { toCosmiconfig } from "../../util/plugin-config.js";
import { hasDependency } from "../../util/plugin.js";
import type { ExecStagedConfig } from "./types.js";

// https://github.com/ItsNickBarry/exec-staged

const title = "exec-staged";

const enablers = ["exec-staged"];

const isEnabled: IsPluginEnabled = ({ dependencies }) =>
  hasDependency(dependencies, enablers);

const config = [
  "package.json",
  "package.yaml",
  "package.yml",
  ...toCosmiconfig("exec-staged"),
];

const resolveConfig: ResolveConfig<ExecStagedConfig> = async (
  config,
  options,
) => {
  if (options.isProduction) return [];

  if (!config) return [];

  const inputs = new Set<Input>();

  for (const entry of config) {
    const script = typeof entry === "string" ? entry : entry.task;
    for (const id of options.getInputsFromScripts(script)) inputs.add(id);
  }

  return Array.from(inputs);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
