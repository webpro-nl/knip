import type { Model } from './model';

export function formatDate(n: number) {
  return new Date(n).toISOString();
}

export function isHidden(models: Model[]) {
  return models.length === 0;
}
