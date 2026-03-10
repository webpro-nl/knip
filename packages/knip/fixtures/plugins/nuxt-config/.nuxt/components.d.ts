import type { DefineComponent } from 'vue';

type LazyComponent<T> = T;

export const Button: typeof import('../components/Button.vue').default;
export const Card: typeof import('../other-components/Card.vue').default;
export const LazyButton: LazyComponent<typeof import('../components/Button.vue').default>;
export const LazyCard: LazyComponent<typeof import('../other-components/Card.vue').default>;
