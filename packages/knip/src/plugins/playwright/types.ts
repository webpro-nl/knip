// Copied from https://github.com/microsoft/playwright/blob/main/packages/playwright/types/test.d.ts

type LiteralUnion<T extends U, U = string> = T | (U & { zz_IGNORE_ME?: never });

type BlobReporterOptions = { outputDir?: string; fileName?: string };
type ListReporterOptions = { printSteps?: boolean };
type JUnitReporterOptions = {
  outputFile?: string;
  stripANSIControlSequences?: boolean;
  includeProjectInTestName?: boolean;
};
type JsonReporterOptions = { outputFile?: string };
type HtmlReporterOptions = {
  outputFolder?: string;
  open?: 'always' | 'never' | 'on-failure';
  host?: string;
  port?: number;
  attachmentsBaseURL?: string;
  title?: string;
  noSnippets?: boolean;
};

type ReporterDescription = Readonly<
  | ['blob']
  | ['blob', BlobReporterOptions]
  | ['dot']
  | ['line']
  | ['list']
  | ['list', ListReporterOptions]
  | ['github']
  | ['junit']
  | ['junit', JUnitReporterOptions]
  | ['json']
  | ['json', JsonReporterOptions]
  | ['html']
  | ['html', HtmlReporterOptions]
  | ['null']
  | [string]
  | [string, any]
>;

type Project = {
  name: string;
  use: string;
  testMatch?: string | RegExp | (string | RegExp)[]; // regexp not supported by Knip
};

export type PlaywrightTestConfig = {
  projects?: Project[];
  testMatch?: string | RegExp | (string | RegExp)[]; // regexp not supported by Knip
  testDir?: string;
  reporter?:
    | LiteralUnion<'dot' | 'line' | 'list' | 'junit' | 'html' | 'json' | 'github' | 'null', string>
    | ReporterDescription[];
  globalSetup?: string | Array<string>;
  globalTeardown?: string | Array<string>;
};
