import type { ConfigurationChief } from '../ConfigurationChief.ts';
import { createManifest, type Manifest } from '../util/package-json.ts';

export type ScriptParserContext = {
  rootManifest: Manifest | undefined;
  getManifest: (dir: string) => Manifest | undefined;
};

export const createScriptParserContext = (chief: ConfigurationChief): ScriptParserContext => {
  const rawRootManifest = chief.getManifestForWorkspace('.');
  const rootManifest = rawRootManifest ? createManifest(rawRootManifest) : undefined;
  const manifests = new Map<string, Manifest | undefined>();
  const getManifest = (dir: string): Manifest | undefined => {
    const workspace = chief.findWorkspaceByFilePath(`${dir}/`);
    if (!workspace) return;
    if (!manifests.has(workspace.name)) {
      const manifest = chief.getManifestForWorkspace(workspace.name);
      manifests.set(workspace.name, manifest ? createManifest(manifest) : undefined);
    }
    return manifests.get(workspace.name);
  };
  return { rootManifest, getManifest };
};
