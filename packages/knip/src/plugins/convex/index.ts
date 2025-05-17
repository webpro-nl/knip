import type { IsPluginEnabled, Plugin } from "../../types/config.js";
import { hasDependency } from "../../util/plugin.js";

// https://docs.convex.dev/home

const title = "Convex";

const enablers = ["convex"];

const isEnabled: IsPluginEnabled = ({ dependencies }) =>
  hasDependency(dependencies, enablers);

const entry: string[] = [
  "convex/*.config.@(js|jsx|ts|tsx)",
  "convex/_generated/*.@(js|jsx|ts|tsx)",
];

export default {
  title,
  enablers,
  isEnabled,
  entry,
} satisfies Plugin;
