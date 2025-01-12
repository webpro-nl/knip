// App project configuration
export interface AppConfig {
  pages: string[];
  subPackages?: Array<{
    root: string;
    pages: string[];
  }>;
  usingComponents?: Record<string, string>;
  workers?: string;
  tabBar?: {
    list: Array<{
      pagePath: string;
      iconPath?: string;
      selectedIconPath?: string;
    }>;
  };
}

// Plugin project configuration
export interface PluginConfig {
  publicComponents: Record<string, string>;
  pages: Record<string, string>;
  main: string;
}

// Page configuration
export interface PageConfig {
  usingComponents?: Record<string, string>;
  component?: boolean;
}

// Component configuration
export interface ComponentConfig {
  component: boolean;
  usingComponents?: Record<string, string>;
}

export interface MiniprogramPluginConfig {
  // Root directory of the miniprogram project
  root?: string;
  // Custom path aliases
  paths?: Record<string, string[]>;
}

export interface MiniprogramDependency {
  specifier: string;
  resolvedPath: string;
  containingFile: string;
}

export interface MiniprogramAnalysisResult {
  pages: MiniprogramDependency[];
  components: MiniprogramDependency[];
  subPackagePages: Array<{
    root: string;
    pages: MiniprogramDependency[];
  }>;
  workers?: MiniprogramDependency[];
  tabBarIcons?: MiniprogramDependency[];
} 