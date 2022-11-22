import type { IsPluginEnabledCallback } from '../../types/plugins.js';

// https://playwright.dev/docs/test-configuration

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => dependencies.has('@playwright/test');

export const CONFIG_FILE_PATTERNS = [];

export const ENTRY_FILE_PATTERNS = ['playwright.config.{js,ts}', '.*{test,spec}.{js,ts,mjs}'];
