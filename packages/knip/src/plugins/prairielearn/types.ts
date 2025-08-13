// https://prairielearn.readthedocs.io/en/latest/schemas/infoElementCore
// https://prairielearn.readthedocs.io/en/latest/schemas/infoQuestion
export type PrairieLearnConfig = {
  dependencies: {
    nodeModulesStyles?: string[];
    nodeModulesScripts?: string[];
  }
  dynamicDependencies?: {
    nodeModulesScripts?: Record<string, string>;
  }
};