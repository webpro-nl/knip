import type { DefineComponent } from 'vue';

type LazyComponent<T> = T;

export const AppHeader: typeof import('../components/AppHeader.vue').default;
export const StatusBadge: typeof import('../components/StatusBadge.vue').default;
export const LazyAppHeader: LazyComponent<typeof import('../components/AppHeader.vue').default>;
export const LazyStatusBadge: LazyComponent<typeof import('../components/StatusBadge.vue').default>;
