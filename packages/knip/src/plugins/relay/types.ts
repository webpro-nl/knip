type RelayProject = {
  artifactDirectory?: string;
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
