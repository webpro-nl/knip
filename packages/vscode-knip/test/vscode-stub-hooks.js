const stub = new URL('./vscode-stub.js', import.meta.url).href;

export const resolve = (specifier, context, nextResolve) =>
  specifier === 'vscode' ? { url: stub, shortCircuit: true } : nextResolve(specifier, context);
