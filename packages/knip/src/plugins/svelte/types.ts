/**
 * @see https://svelte.dev/docs/kit/configuration
 */
export type SvelteKitConfig = {
  kit?: {
    serviceWorker?: {
      register?: boolean;
    };
    files?: {
      serviceWorker?: string;
    };
  };
};
