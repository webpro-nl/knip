import type { HandleClientError } from '@sveltejs/kit';

export const handleError: HandleClientError = async () => {
  return {
    message: '',
    errorId: '',
  };
};
