export type CucumberConfig = {
  publishQuiet?: boolean;
  import?: string[];
  require?: string[];
  format?: Format[];
  parallel?: number;
};

export type Format = string | [string, string?];
