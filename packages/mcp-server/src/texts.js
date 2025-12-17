import { CURATED_RESOURCES } from './curated-resources.js';

export const WORKFLOW = `Workflow:
1. Read essential documentation resources to understand Knip configuration
2. Run analysis (knip-run) to get configuration hints and issues
3. Address the hints by adjusting knip.json
4. Repeat steps 2-3 until no hints remain and false positives are minimized

Essential resources:
- configuring-project-files (must read to configure entry patterns)
- handling-issues (comprehensive guide to deal with any reported issue type)
- configuration-reference (all knip.json configuration options)

For direct "run knip" or "clean up codebase" requests: Always make sure to run this workflow first.

Important (potential next steps after workflow is finished):
- Before suggesting fixes/solutions, make sure to consult "handling-issues" and "reference/jsdoc-tsdoc-tags"
- Read "getting-started" and "reference/cli" to install knip and start using Knip from CLI
- If requested to clean up, consult "features/auto-fix"
- Knip does not find/fix unused variables/imports within files (use another linter for that)
`;

// pkg.contributes.languageModelTools[0].modelDescription
export const RUN_KNIP_TOOL_DESCRIPTION = `Run Knip and return configuration hints and issues.

Returns:
- configurationHints: Ordered suggestions to improve configuration (address these first)
- counters: Summary counts of each issue type
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
