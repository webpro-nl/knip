import type { Issue, IssueType } from 'knip/session';

export type Config = {
  enabled: boolean;
  configFilePath?: string;
  editor: {
    exports: {
      codelens: {
        enabled: boolean;
      };
      hover: {
        enabled: boolean;
        includeImportLocationSnippet: boolean;
        maxSnippets: number;
        timeout: number;
      };
      quickfix: {
        enabled: boolean;
        jsdocTags?: string[];
      };
      highlight: {
        dimExports: boolean;
        dimTypes: boolean;
      };
    };
  };
  imports: {
    enabled: boolean;
  };
  exports: {
    enabled: boolean;
    contention: {
      enabled: boolean;
    };
  };
};

export type IssueForFile = {
  issue: Issue;
  issueType: IssueType;
  diagnostic: Diagnostic;
};

export type IssuesForFile = Map<string, IssueForFile>;

export type IssuesByUri = Map<string, IssuesForFile>;
