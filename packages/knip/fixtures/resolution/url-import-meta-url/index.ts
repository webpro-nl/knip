new URL('./file.css', import.meta.url);
new URL('./file.js', import.meta.url);
new URL('./404.js', import.meta.url);

/** @knipignore */
new URL('./node_modules/ignored-url-package/index.js', import.meta.url);
/** @knipignore */
new URL('./node_modules/declared-url-package/index.js', import.meta.url);
new URL('./node_modules/unlisted-url-package/index.js', import.meta.url);
