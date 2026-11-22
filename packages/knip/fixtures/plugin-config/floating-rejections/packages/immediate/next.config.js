Promise.reject(new Error('boom'));

const target = ['.', 'src', 'dynamic.ts'].join('/');

module.exports = () => ({ turbopack: { resolveAlias: { virtual: target } } });
