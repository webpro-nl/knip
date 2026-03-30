type RelayProject = {
  artifactDirectory?: string;
  requireCustomScalarTypes?: boolean;
  customScalarTypes?: Record<
    string,
    | string
    | {
        name: string;
        path: string;
      }
  >;
};

export type RelayConfig =
  | RelayProject
  | {
      projects: Record<string, RelayProject>;
    };
