import type { IsPluginEnabledCallback } from '../../types/plugins.js';

// https://docs.cypress.io/guides/references/configuration

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => dependencies.has('cypress');

export const CONFIG_FILE_PATTERNS = [];

export const ENTRY_FILE_PATTERNS = [
  'cypress.config.{js,ts,mjs,cjs}',
  'cypress/support/e2e.{js,jsx,ts,tsx}',
  'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
];
