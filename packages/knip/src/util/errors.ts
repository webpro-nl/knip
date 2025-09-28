import { core } from 'zod/mini';

const isZodErrorLike = (error: unknown): error is core.$ZodError<any> => error instanceof core.$ZodError;

interface ErrorWithCause extends Error {
  cause: Error;
}

export class ConfigurationError extends Error {}

export class LoaderError extends Error {}

export const isKnownError = (error: Error) =>
  error instanceof ConfigurationError || error instanceof LoaderError || isZodErrorLike(error);

export const hasErrorCause = (error: Error): error is ErrorWithCause =>
  !isZodErrorLike(error) && error.cause instanceof Error;

export const isConfigurationError = (error: Error) => error instanceof ConfigurationError;

export const getKnownErrors = (error: Error) => {
  if (isZodErrorLike(error)) return [...error.issues].map(error => new Error(error.message));
  return [error];
};
