import type { IsPluginEnabledCallback } from '../../types/plugins.js';

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => dependencies.has('rollup');

export const CONFIG_FILE_PATTERNS = [];

export const ENTRY_FILE_PATTERNS = ['rollup.config.{js,mjs}'];
