import type { Config } from 'payload';

declare module 'payload' {
  export interface GeneratedTypes extends Config {}
}
