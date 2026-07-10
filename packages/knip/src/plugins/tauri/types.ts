type BeforeCommand = string | { script?: string; cwd?: string; wait?: boolean };

export interface TauriConfig {
  build?: {
    beforeDevCommand?: BeforeCommand;
    beforeBuildCommand?: BeforeCommand;
    beforeBundleCommand?: BeforeCommand;
    'before-dev-command'?: BeforeCommand;
    'before-build-command'?: BeforeCommand;
    'before-bundle-command'?: BeforeCommand;
  };
}
