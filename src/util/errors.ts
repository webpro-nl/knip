export class ConfigurationError extends Error {}

export class LoaderError extends Error {}

export const isKnownError = (error: Error) => error instanceof ConfigurationError || error instanceof LoaderError;
