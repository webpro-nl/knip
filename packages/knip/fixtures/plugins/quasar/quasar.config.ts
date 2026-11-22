import { configure } from 'quasar/wrappers';

export default configure(() => ({
  boot: [
    'vintage',
    { path: 'barrels' },
    'literal',
    '~@quasar/quasar-app-extension-qmarkdown/dist/boot/vite-register.js',
  ],
  css: ['app.scss', '~animate.css/animate.min.css'],
  sourceFiles: {
    router: 'src/router/wine-routes',
    pwaRegisterServiceWorker: 'src-pwa/warm-cellar',
  },
}));
