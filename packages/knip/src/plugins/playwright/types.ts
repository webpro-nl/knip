// Copied from https://github.com/microsoft/playwright/blob/main/packages/playwright/types/test.d.ts

type LiteralUnion<T extends U, U = string> = T | (U & { zz_IGNORE_ME?: never });

type ReporterDescription = Readonly<
  | ['blob']
  | ['blob', { outputDir?: string; fileName?: string }]
  | ['dot']
  | ['line']
  | ['list']
  | ['list', { printSteps?: boolean }]
  | ['github']
  | ['junit']
  | ['junit', { outputFile?: string; stripANSIControlSequences?: boolean; includeProjectInTestName?: boolean }]
  | ['json']
  | ['json', { outputFile?: string }]
  | ['html']
  | [
      'html',
      {
        outputFolder?: string;
        open?: 'always' | 'never' | 'on-failure';
        host?: string;
        port?: number;
        attachmentsBaseURL?: string;
      },
    ]
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
};
