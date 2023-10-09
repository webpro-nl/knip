let parseArgs: typeof import('node:util').parseArgs;
try {
  parseArgs = (await import('node:util')).parseArgs;
} catch (error) {
  // @ts-expect-error Almost compatible, let's use the built-in types
  parseArgs = (await import('@pkgjs/parseargs')).parseArgs;
}
export { parseArgs };
