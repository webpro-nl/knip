import type { Entries } from 'type-fest';

declare global {
  type ObjectEntries<T> = Entries<T>;
}
