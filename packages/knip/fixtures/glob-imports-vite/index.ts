const components = import.meta.glob('./components/*.tsx');
const hooks = import.meta.globEager('./hooks/use*.ts');
const utils = import.meta.glob(['./utils/*.ts', './helpers/*.ts']);
const theme = import.meta.glob('./styles/theme/**/*.ts');
const allFiles = import.meta.glob('./**/*.ts');

export { components, hooks, utils, theme, allFiles };
