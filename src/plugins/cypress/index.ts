import { hasDependency } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { GenericPluginCallback, IsPluginEnabledCallback } from '../../types/plugins.js';

// https://docs.cypress.io/guides/references/configuration

export const NAME = 'Cypress';

/** @public */
export const ENABLERS = ['cypress'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

/** @public */
export const ENTRY_FILE_PATTERNS = [
  'cypress.config.{js,ts,mjs,cjs}',
  'cypress/support/e2e.{js,jsx,ts,tsx}',
  'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
  'cypress/plugins/index.js', // Deprecated since Cypress v10
];

export const findDependencies: GenericPluginCallback = async (configFilePath, { isProduction }) => {
  if (isProduction) return [];
  return ENTRY_FILE_PATTERNS.map(toEntryPattern);
};
