import { configure } from 'quasar/wrappers';

export default configure(() => ({
  boot: ['vintage', { path: 'barrels' }, 'literal'],
  css: ['app.scss'],
  sourceFiles: {
    router: 'src/router/wine-routes',
    pwaRegisterServiceWorker: 'src-pwa/warm-cellar',
  },
}));
