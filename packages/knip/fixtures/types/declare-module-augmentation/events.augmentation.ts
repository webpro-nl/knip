declare module './events.js' {
  type EntityWithMeta = BaseEntity & { meta: string };

  export interface EventBusEvents extends EventEnvelope {
    'entity:created': EntityWithMeta;
    'entity:updated': BaseEntity & { revision: number };
  }
}

declare module '#events' {
  export interface EventBusEvents {
    'entity:audited': AuditTrail & { at: number };
  }
}

declare module '#phantom' {
  export interface EventBusEvents {
    'entity:phantom': PhantomPayload;
  }
}

export {};
