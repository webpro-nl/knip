type RaycastManifestCommand = {
  name?: unknown;
};

type RaycastManifestTool = {
  name?: unknown;
};

export type RaycastManifest = {
  commands?: RaycastManifestCommand[];
  tools?: RaycastManifestTool[];
};
