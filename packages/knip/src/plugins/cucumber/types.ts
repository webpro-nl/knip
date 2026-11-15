export type CucumberConfig = {
  publishQuiet?: boolean;
  import?: string[];
  require?: string[];
  requireModule?: string[];
  format?: Format[];
  parallel?: number;
};

export type Format = string | [string, string?];
