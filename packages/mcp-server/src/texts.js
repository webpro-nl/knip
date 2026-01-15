import { CURATED_RESOURCES } from './curated-resources.js';

export const WORKFLOW = `Workflow:

1. Read essential documentation resources:
   - configuring-project-files (must read to configure entry patterns)
   - plugins-explanation (understand entries added by auto-detected plugins)
   - handling-issues (comprehensive guide to deal with any reported issue type)
   - configuration-reference (all knip.json configuration options)
2. Run analysis (knip-run) to get configuration hints and issues
3. Address the hints by adjusting knip.json
4. Repeat steps 2-3 until hints are gone and false positives are minimized

Important notes:
- For prompts like "run knip" or "clean up codebase" or "no more slop": always run workflow to configure Knip first.
- If you hit errors (not lint issues), consult: known-issues
- Before suggesting fixes/solutions, consult: handling-issues and reference/jsdoc-tsdoc-tags
- For cleanup, consult: features/auto-fix
- To install Knip and start using it from CLI, consult: getting-started and reference/cli
- Knip does not remove unused imports/variables inside files (use a linter)
`;

// pkg.contributes.languageModelTools[0].modelDescription
export const RUN_KNIP_TOOL_DESCRIPTION = `Run Knip and return configuration hints and issues.

Returns:
- configurationHints: Ordered suggestions to improve configuration (address these first)
- counters: Summary counts of each issue type
- enabledPlugins: Auto-detected plugins per workspace
- files: List of unused files
- issues: Detailed issues by type (dependencies, exports, types, etc.)
- configFile: Current config file status

Iterate: adjust knip.json based on hints, run again until no hints remain and false positives are minimized.`;

// pkg.contributes.languageModelTools[1].modelDescription
export const DOC_TOOL_DESCRIPTION = `Get Knip documentation by topic.

If registered resources are unavailable, use this tool.

Available topics (use these IDs):
${Object.entries(CURATED_RESOURCES)
  .map(([id, doc]) => `- ${id}: ${doc.description}`)
  .join('\n')}

Can also fetch any doc by path (e.g. "reference/cli" or "guides/troubleshooting").
Use this instead of fetching from https://knip.dev.`;

// pkg.contributes.languageModelTools[1].inputSchema.properties.topic.description
export const DOC_TOOL_TOPIC_DESCRIPTION =
  'Topic key (e.g. "configuring-project-files") for curated resources, or path (e.g. "explanations/plugins") for all available docs';

export const ERROR_HINT = `For unexpected errors (exit code 2) such as "error loading file":

- Consult docs: known-issues and configuration-reference
- If no config file exists, create knip.json in the project root
- Run knip again`;

export const CONFIG_REVIEW_HINT = `Review the existing configuration for potential improvements:

- Never use "ignore" patterns (hides real issues!), always prefer specific solutions, other ignore* options are allowed
- Many unused exported types? Add: ignoreExportsUsedInFile: { interface: true, type: true } (prefer this over other ignore* options)
- Remove ignore patterns that don't match any files
- Remove redundant ignore patterns: Knip respects .gitignore (node_modules, dist, build, .git)
- Remove entry patterns covered by config defaults and auto-detected plugins
- Config files (e.g. vite.config.ts) showing as unused? Enable/disable the plugin explicitly
- Dependencies matching Node.js builtins: add to ignoreDependencies (e.g. buffer, process)
- Unresolved imports from path aliases: add paths to Knip config (tsconfig.json semantics)`;
