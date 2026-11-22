import { substringBefore } from './string.ts';

interface ErrorWithCause extends Error {
  cause: Error;
}

export class ConfigurationError extends Error {}

export class ConfigurationValidationError extends Error {
  errors: string[];

  constructor(errors: string[]) {
    super(errors.join('\n'));
    this.errors = errors;
  }
}

export class CompilerError extends Error {}

export class LoaderError extends Error {}

export const isKnownError = (error: Error) =>
  error instanceof ConfigurationError ||
  error instanceof CompilerError ||
  error instanceof LoaderError ||
  error instanceof ConfigurationValidationError;

export const hasErrorCause = (error: Error): error is ErrorWithCause => error.cause instanceof Error;

export const isConfigurationError = (error: Error) => error instanceof ConfigurationError;

export const isModuleNotFoundError = (error: Error): boolean => 'code' in error && error.code === 'MODULE_NOT_FOUND';

export const isLoaderError = (error: Error): error is LoaderError => error instanceof LoaderError;

export const formatCauseMessage = (error: Error, cwd: string) => {
  let root: Error = error;
  while (root.cause instanceof Error) root = root.cause;
  return substringBefore(root.message, '\n').replace(`${cwd}/`, '');
};

export const getKnownErrors = (error: Error) => {
  if (error instanceof ConfigurationValidationError) return Array.from(error.errors, message => new Error(message));
  return [error];
};
