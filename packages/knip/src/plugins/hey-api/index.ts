import type {
  IsPluginEnabled,
  Plugin,
  ResolveConfig,
} from "../../types/config.js";
import { toDeferResolve } from "../../util/input.js";
import { hasDependency } from "../../util/plugin.js";
import type { PluginConfig } from "./types.js";

// https://heyapi.dev/openapi-ts/get-started

const title = "hey-api";

const enablers = ["hey-api"];

const isEnabled: IsPluginEnabled = ({ dependencies }) =>
  hasDependency(dependencies, enablers);

const config: string[] = [];

const entry: string[] = [];

const production: string[] = [];

const resolveConfig: ResolveConfig<PluginConfig> = async (config) => {
  const inputs = config?.plugins ?? [];
  return [...inputs].map(toDeferResolve);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  production,
  resolveConfig,
} satisfies Plugin;
