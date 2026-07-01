declare module './events.js' {
  type EntityWithMeta = BaseEntity & { meta: string };

  export interface EventBusEvents extends EventEnvelope {
    'entity:created': EntityWithMeta;
    'entity:updated': BaseEntity & { revision: number };
  }
}

export {};
