// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/6dfee7b81f699209d0b25b06018c633e0c67d38c/types/karma/index.d.ts#L202-L579
// Just relevant parts are copy/pasted because:
//  - Some types depend on other deps (`log4js`)
//  - Needs manual fixing of some linter issues

//👇 Partial copy/paste with relevant options for Knip
export interface Config {
  set: (config: ConfigOptions) => void;
}

//👇 Partial copy/paste with relevant options for Knip
export interface ConfigOptions {
  /**
   * @default ''
   * @description The root path location that will be used to resolve all relative paths defined in <code>files</code> and <code>exclude</code>.
   * If the basePath configuration is a relative path then it will be resolved to
   * the <code>__dirname</code> of the configuration file.
   */
  basePath?: string | undefined;
  /**
   * @default []
   * @description List of files/patterns to exclude from loaded files.
   */
  exclude?: string[] | undefined;
  /**
   * @default []
   * @description List of files/patterns to load in the browser.
   */
  files?: Array<FilePattern | string> | undefined;
  /**
   * @default []
   * @description List of test frameworks you want to use. Typically, you will set this to ['jasmine'], ['mocha'] or ['qunit']...
   * Please note just about all frameworks in Karma require an additional plugin/framework library to be installed (via NPM).
   */
  frameworks?: string[] | undefined;
  /**
   * @default ['karma-*']
   * @description List of plugins to load. A plugin can be a string (in which case it will be required
   * by Karma) or an inlined plugin - Object.
   * By default, Karma loads all sibling NPM modules which have a name starting with karma-*.
   * Note: Just about all plugins in Karma require an additional library to be installed (via NPM).
   */
  plugins?: Array<PluginName | InlinePluginDef> | undefined;
}

type PluginName = string;
type InlinePluginDef = Record<PluginName, InlinePluginType>;
type InlinePluginType = FactoryFnType | ConstructorFnType | ValueType;
type FactoryFnType = ['factory', FactoryFn];
type FactoryFn = (...params: any[]) => any;
type ConstructorFnType = ['type', ConstructorFn];
// biome-ignore lint/complexity/noBannedTypes: copy/pasted
type ConstructorFn = Function | (new (...params: any[]) => any);
type ValueType = ['value', any];

//👇 Partial extraction of relevant options for Knip
interface FilePattern {
  /**
   * The pattern to use for matching.
   */
  pattern: string;
}
