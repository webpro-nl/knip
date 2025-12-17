import { CURATED_RESOURCES } from './curated-resources.js';

export const WORKFLOW = `Workflow:
1. Read the essential documentation resources to understand Knip configuration
2. Call the run-knip tool to analyze the project and get configuration hints
3. Follow the hints to adjust the configuration (create/modify knip.json)
4. Run again until there are no more hints and false positives are minimized

Key resources to consult:
- configuring-project-files: How to set entry and project patterns
- handling-issues: How to deal with reported issues
- configuration-reference: Complete reference of all options

Start by reading the documentation, then run the tool.`;

// pkg.contributes.languageModelTools[0].modelDescription
export const RUN_KNIP_TOOL_DESCRIPTION = `Run Knip and return configuration hints and issues.

Returns:
- configurationHints: Ordered suggestions to improve configuration (address these first)
- counters: Summary counts of each issue type
- files: List of unused files
- issues: Detailed issues by type (dependencies, exports, types, etc.)
- configFile: Current config file status

Iterate: adjust knip.json based on hints, run again until hints are resolved.`;

// pkg.contributes.languageModelTools[1].modelDescription
export const DOC_TOOL_DESCRIPTION = `Get Knip documentation by topic.

If registered resources are unavailable, use this tool.

Available topics (use these IDs):
${Object.entries(CURATED_RESOURCES)
  .map(([id, doc]) => `- ${id}: ${doc.description}`)
  .join('\n')}

Can also fetch any doc by path (e.g., "reference/cli" or "guides/troubleshooting").
Use this instead of fetching from knip.dev.`;

// pkg.contributes.languageModelTools[1].inputSchema.properties.topic.description
export const DOC_TOOL_TOPIC_DESCRIPTION =
  'Topic key (e.g. "configuring-project-files") for curated resources, or path (e.g. "explanations/plugins") for all available docs';

export const ERROR_HINT = `For unexpected errors (exit code 2) such as "error loading file":
- Consult docs: known-issues and configuration-reference
- If no config file exists, create knip.json in root: {"$schema":"https://unpkg.com/knip@5/schema.json"}
- Damage control for "error loading file":
  1) First try to disable the related plugin's config file:
     - E.g. vite: { config: [] }
     - In a monorepo use e.g. { workspaces: { "packages/lib": { vite: { config: [] } } } }
     - If this succeeds, add the file as a regular entry point
  2) Then try to disable the related plugin:
     - E.g. vite: false
     - In a monorepo use e.g. { workspaces: { "packages/lib": { vite: false } } }
     - If this succeeds, add the file as a regular entry point
  3) As a last resort, ignore the workspace: ignoreWorkspaces: ["packages/lib"]
- Run knip again`;

export const CONFIG_REVIEW_HINT = `Review the existing configuration for potential improvements:

- Never use "ignore" patterns (hides real issues!), always prefer specific solutions, other ignore* options are allowed
- Ignore patterns that don't match any files can be removed
- Redundant ignore patterns: Knip respects .gitignore by default (node_modules, dist, build, .git)
- Entry patterns already covered by plugins can be removed
- Config files (e.g. vite.config.ts) showing as unused? Enable/disable the plugin explicitly
- Many unused exported types? Add: ignoreExportsUsedInFile: { interface: true, type: true }
- Dependencies matching Node.js builtins: add to ignoreDependencies (e.g. buffer, process)
- Unresolved imports from path aliases: add paths to Knip config (tsconfig.json semantics)`;
