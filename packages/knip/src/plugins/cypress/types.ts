interface CypressTestingTypeConfig {
  specPattern?: string[];
  supportFile?: string;
  reporter?: string;
  reporterOptions?: { configFile?: string };
}

export interface CypressConfig extends CypressTestingTypeConfig {
  component?: CypressTestingTypeConfig;
  e2e?: CypressTestingTypeConfig;
}
