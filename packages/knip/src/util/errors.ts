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
  if (isZodErrorLike(error))
    return [...error.issues].map(error => {
      let message = error.message;
      const details = [];
      if (error.path.length > 0) details.push(`location: ${error.path.join('.')}`);
      // @ts-expect-error
      if (typeof error.expected === 'string') details.push(`expected: ${error.expected}`);
      if (details.length > 0) message += ` (${details.join(', ')})`;
      return new Error(message);
    });
  return [error];
};
