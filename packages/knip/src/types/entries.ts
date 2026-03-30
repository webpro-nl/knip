export type Entries<T> = Array<{ [K in keyof T]: [K, T[K]] }[keyof T]>;
