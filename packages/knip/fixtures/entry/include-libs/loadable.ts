import loadable from '@loadable/component';

export const LoadableApple = loadable(() => import('./components.js'), {
  resolveComponent: components => components.Apple,
});

export const LoadableOrange = loadable(() => import('./components.js'), {
  resolveComponent: components => components.Orange,
});
