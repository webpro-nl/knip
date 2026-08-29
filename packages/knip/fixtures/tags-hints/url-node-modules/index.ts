import url from 'node:url';

/** @knipignore */
export const foo = async () => {
  /** @knipignore */
  const path = url.fileURLToPath(
    /** @knipignore */
    new URL(
      /** @knipignore */
      './node_modules/app/index.js',
      import.meta.url,
    ),
  );

  return path;
};
