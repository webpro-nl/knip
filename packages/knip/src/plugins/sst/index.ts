import type { IsPluginEnabled, Plugin } from "../../types/config.js";
import { hasDependency } from "../../util/plugin.js";

// link to sst docs

const title = "sst";

const enablers = ["sst"];

const isEnabled: IsPluginEnabled = ({ dependencies }) =>
  hasDependency(dependencies, enablers);

const entry = [
  "sst.config.{js,cjs,mjs,ts}",
  "{handlers,lambdas}/*.{js,cjs,mjs,ts}",
  "src/{handlers,lambdas}/*.{js,cjs,mjs,ts}",
];

export default {
  title,
  enablers,
  isEnabled,
  entry,
} satisfies Plugin;
