export interface BaseEntity {
  id: string;
}

export interface EventEnvelope {
  at: number;
}

export interface AuditTrail {
  actor: string;
}

export interface EventBusEvents {}
