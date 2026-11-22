import { CURATED_RESOURCES } from './curated-resources.js';

export const WORKFLOW = `Workflow:

1. Run analysis (knip-run): returns configurationHints, issues keyed by type, and docs (the doc topics that apply to this result)
2. Read the topics in docs with knip-docs (skip the ones you already read); a topic#section returns only that section
3. Address the configuration hints by adjusting knip.json
4. Repeat steps 1-3 until configuration hints are gone and remaining issues are genuine findings

You're done when there are no configuration hints and the issues are genuine (or zero). Many projects need NO knip.json: Knip auto-detects plugins, so configFile exists:false with zero hints is a good, complete result. Don't add configuration just to have it.

Important notes:
- For prompts like "run knip" or "clean up codebase" or "no more slop": always run workflow to configure Knip first.
- Use knip-run instead of the Knip CLI: it returns configuration hints and structured results.
- To decode results, consult: configuration-hints and issue-types
- For knip.json options, consult: configuration-reference (or one option, e.g. configuration-reference#ignorebinaries)
- Config files reported as unused, or entry files missing for a tool, consult: plugins-explanation
- If you hit errors (not lint issues), consult: known-issues
- Before suggesting fixes/solutions, read the handling-issues sections in docs, and consult: jsdoc-tsdoc-tags
- Prefer specific solutions over "ignore"; to focus or mute issue types, consult: rules-and-filters
- For cleanup, consult: auto-fix
- To install Knip and start using it from CLI, consult: getting-started and cli
- Knip does not remove unused imports/variables inside files (use a linter)
`;

export const SERVER_INSTRUCTIONS =
  'Knip finds unused files, dependencies and exports in JavaScript/TypeScript projects. To configure Knip or resolve its findings: call knip-run first, read the topics it lists in docs with knip-docs, address configurationHints in knip.json, and repeat until no hints remain and the remaining issues are genuine. Use knip-run instead of the Knip CLI.';

// pkg.contributes.languageModelTools[0].modelDescription
export const RUN_KNIP_TOOL_DESCRIPTION = `Run Knip and return configuration hints and issues.

Returns:
- totalIssues: Total number of issues found (0 = clean)
- configurationHints: Ordered suggestions to improve configuration (address these first)
- docs: Doc topics that apply to this result, some with a #section (read them with knip-docs)
- knipVersion: Version of Knip that ran (bundled with the MCP Server)
- projectKnipVersion: Version of knip installed in the project, if any (versionHint explains a mismatch)
- counters: Per-issue-type totals
- maybeUnconfigured: true when a high unused-file count suggests entry/project may be incomplete (review configurationHints)
- truncated: true when the sample was capped; read counters for totals, or scope with workspace to see the rest
- enabledPlugins: Auto-detected plugins per workspace
- files: Unused files (sample, might be capped)
- issues: Issues per type, i.e. dependencies, exports, types, etc. (sample, capped per type)
- configFile: Config file status (exists:false is normal when plugins auto-configure)

Options:
- cwd: Working directory (defaults to the process cwd)
- workspace: Scope run to array of workspaces (to drill into a package when truncated)

Iterate: adjust knip.json based on hints, run again until no hints remain and false positives are minimized.`;

// pkg.contributes.languageModelTools[1].modelDescription
export const DOC_TOOL_DESCRIPTION = `Fetch a Knip doc by topic id, or by any docs path. Consult it to resolve a finding, hint, or error instead of guessing.

Available topics (use these IDs):
${Object.entries(CURATED_RESOURCES)
  .map(([id, doc]) => `- ${id}: ${doc.description}`)
  .join('\n')}

Full descriptions are registered as MCP resources; any page is also reachable by path (e.g. "guides/troubleshooting"). Append #section to get only that section (e.g. "handling-issues#unused-dependencies"). Use this instead of fetching from https://knip.dev.`;

// pkg.contributes.languageModelTools[1].inputSchema.properties.topic.description
export const DOC_TOOL_TOPIC_DESCRIPTION =
  'Topic key (e.g. "configuring-project-files") for curated resources, or path (e.g. "explanations/plugins") for all available docs, optionally with a #section (e.g. "handling-issues#unused-dependencies")';

export const ERROR_HINT = `For unexpected errors (exit code 2) such as "Error loading ...":

- Call knip-docs with topic "known-issues" and "configuration-reference"
- If no knip config file exists yet, create knip.json in the project root first
- Apply a workaround, then run knip-run again`;

export const UNCONFIGURED_HINT =
  'Many unused files were found. This often means entry/project patterns are not configured yet (so some results may be false positives), but could mean real dead code. A capped sample of issues is shown — see `counters` for true totals. Address the configurationHints first, then re-run; or scope with `workspace` to analyze one package at a time.';

export const CONFIG_REVIEW_HINT = `Review the configuration for improvements that apply to the issues you see (skip the ones that don't):

- Avoid the broad "ignore" option (file globs); it hides real issues, so prefer specific fixes. Targeted ignoreDependencies/ignoreBinaries/ignoreUnresolved are fine for justified, known false positives
- Many unused exported types → try ignoreExportsUsedInFile: { interface: true, type: true }
- Remove ignore patterns that don't match any files
- Remove redundant ignore patterns — Knip respects .gitignore (node_modules, dist, build, .git)
- Remove entry patterns covered by config defaults and auto-detected plugins
- Config files (e.g. vite.config.ts) showing as unused → try enable or disable the plugin explicitly (vite: true)
- Dependencies matching Node.js builtins: add to ignoreDependencies (e.g. buffer, process)
- Unresolved imports from path aliases: add paths to Knip config (tsconfig.json semantics)`;

/**
 * @param {string} version Version of Knip bundled with the MCP Server (used by knip-run)
 * @param {string} projectVersion Version of knip installed in the project
 */
export const getVersionHint = (version, projectVersion) =>
  `knip-run uses Knip ${version} (bundled with the Knip MCP Server), but this project has knip ${projectVersion} installed (used by its knip CLI and CI). Results and configuration hints can differ between versions, so tell the user and suggest aligning them.`;

export const CLEAN_HINT =
  'No issues and no configuration hints: Knip is happy. Many projects need no knip.json (plugins are auto-detected), so this is a complete, successful result with nothing more to configure.';
