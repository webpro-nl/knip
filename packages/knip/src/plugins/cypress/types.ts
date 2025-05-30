export interface CypressConfig {
  reporter: string;
  reporterOptions?: { configFile?: string };
  component?: {
    specPattern?: string[];
    supportFile?: string;
  };
  e2e?: {
    specPattern?: string[];
    supportFile?: string;
  };
}
