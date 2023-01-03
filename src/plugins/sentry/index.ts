import type { IsPluginEnabledCallback } from '../../types/plugins.js';

// https://docs.sentry.io/platforms/javascript/configuration/

export const NAME = 'Sentry';

/** @public */
export const ENABLERS = [
  '@sentry/browser',
  '@sentry/electron',
  '@sentry/ember',
  '@sentry/gatsby',
  '@sentry/nextjs',
  '@sentry/remix',
  '@sentry/replay',
  '@sentry/tracing',
];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) =>
  ENABLERS.some(enabler => dependencies.has(enabler));

export const ENTRY_FILE_PATTERNS = ['sentry.{client,server}.config.{js,ts}'];
