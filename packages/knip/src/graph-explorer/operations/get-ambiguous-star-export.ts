import type { ExportOriginResolution } from './resolve-export-origins.ts';

export interface AmbiguousStarExport {
  origins: { filePath: string; identifier: string }[];
}

export const getAmbiguousStarExport = (
  resolution: ExportOriginResolution,
  identifier: string
): AmbiguousStarExport | undefined => {
  if (identifier === 'default') return;
  if (resolution.hasExplicitExport || resolution.origins.length < 2) return;

  const origins = [];
  for (const origin of resolution.origins) {
    origins.push({ filePath: origin.filePath, identifier: origin.identifier });
  }
  return { origins };
};
