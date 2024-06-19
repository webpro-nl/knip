import type { EleventyConfig } from './types.js';

// https://github.com/11ty/eleventy/blob/main/src/UserConfig.js

/** @public */
export class DummyEleventyConfig {
  _getUniqueId() {}
  reset() {}
  versionCheck() {}
  on() {}
  emit() {}
  _enablePluginExecution() {}
  addMarkdownHighlighter() {}
  addLiquidTag() {}
  addLiquidFilter() {}
  addNunjucksAsyncFilter() {}
  addNunjucksFilter() {}
  addHandlebarsHelper() {}
  addFilter() {}
  addAsyncFilter() {}
  getFilter() {}
  addNunjucksTag() {}
  addGlobalData() {}
  addNunjucksGlobal() {}
  addTransform() {}
  addLinter() {}
  addLayoutAlias() {}
  setLayoutResolution() {}
  enableLayoutResolution() {}
  getCollections() {}
  addCollection() {}
  addPlugin() {}
  _getPluginName() {}
  _executePlugin() {}
  getNamespacedName() {}
  namespace() {}
  addPassthroughCopy(input: string | Record<string, string>) {
    if (typeof input === 'string') {
      this.passthroughCopies[input] = {};
    } else {
      for (const [inputPath] of Object.entries(input)) {
        this.passthroughCopies[inputPath] = {};
      }
    }
  }
  _normalizeTemplateFormats() {}
  setTemplateFormats() {}
  addTemplateFormats() {}
  setLibrary() {}
  amendLibrary() {}
  setPugOptions() {}
  setLiquidOptions() {}
  setNunjucksEnvironmentOptions() {}
  setNunjucksPrecompiledTemplates() {}
  setEjsOptions() {}
  setDynamicPermalinks() {}
  setUseGitIgnore() {}
  addShortcode() {}
  addAsyncShortcode() {}
  addNunjucksAsyncShortcode() {}
  addNunjucksShortcode() {}
  addLiquidShortcode() {}
  addHandlebarsShortcode() {}
  addPairedShortcode() {}
  addPairedAsyncShortcode() {}
  addPairedNunjucksAsyncShortcode() {}
  addPairedNunjucksShortcode() {}
  addPairedLiquidShortcode() {}
  addPairedHandlebarsShortcode() {}
  addJavaScriptFunction() {}
  setDataDeepMerge() {}
  isDataDeepMergeModified() {}
  addWatchTarget() {}
  setWatchJavaScriptDependencies() {}
  setServerOptions() {}
  setBrowserSyncConfig() {}
  setChokidarConfig() {}
  setWatchThrottleWaitTime() {}
  setFrontMatterParsingOptions() {}
  setQuietMode() {}
  addExtension() {}
  addDataExtension() {}
  setUseTemplateCache() {}
  setPrecompiledCollections() {}
  setServerPassthroughCopyBehavior() {}
  addUrlTransform() {}
  setDataFileSuffixes() {}
  setDataFileBaseName() {}
  getMergingConfigObject() {}

  _uniqueId = {};
  events = {};
  benchmarkManager = {};
  benchmarks = {};
  collections = {};
  precompiledCollections = {};
  templateFormats = {};
  liquidOptions = {};
  liquidTags = {};
  liquidFilters = {};
  liquidShortcodes = {};
  liquidPairedShortcodes = {};
  nunjucksEnvironmentOptions = {};
  nunjucksPrecompiledTemplates = {};
  nunjucksFilters = {};
  nunjucksAsyncFilters = {};
  nunjucksTags = {};
  nunjucksGlobals = {};
  nunjucksShortcodes = {};
  nunjucksAsyncShortcodes = {};
  nunjucksPairedShortcodes = {};
  nunjucksAsyncPairedShortcodes = {};
  javascriptFunctions = {};
  markdownHighlighter = null;
  libraryOverrides = {};
  passthroughCopies: Record<string, Record<never, never>> = {};
  layoutAliases = {};
  layoutResolution = true;
  linters = {};
  transforms = {};
  activeNamespace = '';
  DateTime = {};
  dynamicPermalinks = true;
  useGitIgnore = true;
  ignores = new Set();
  watchIgnores = new Set();
  dataDeepMerge = true;
  extensionMap = new Set();
  watchJavaScriptDependencies = true;
  additionalWatchTargets = [];
  serverOptions = {};
  globalData = {};
  chokidarConfig = {};
  watchThrottleWaitTime = 0;
  dataExtensions = new Map();
  quietMode = false;
  plugins = [];
  _pluginExecution = false;
  useTemplateCache = true;
  dataFilterSelectors = new Set();
  libraryAmendments = {};
  serverPassthroughCopyBehavior = '';
  urlTransforms = [];
  dataFileSuffixesOverride = false;
  dataFileDirBaseNameOverride = false;
  frontMatterParsingOptions = {
    engines: {},
  };
  templateFormatsAdded = {};
}

// https://www.11ty.dev/docs/config/#configuration-options
export const defaultEleventyConfig: EleventyConfig = {
  dir: {
    input: '.',
    output: '_site',
    includes: '_includes',
    layouts: '_includes',
    data: '_data',
  },
  templateFormats: '11ty.js',
};
