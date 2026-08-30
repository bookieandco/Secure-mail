export type StorageAuditAction = 'PUT' | 'GET' | 'HEAD' | 'LIST' | 'DELETE';
export type StorageAuditDecision = 'ALLOW' | 'DENY';
export type StorageAuditReason = 'AUTHORIZED' | 'ACCESS_DENIED' | 'QUOTA_EXCEEDED' | 'VERSION_CONFLICT' | 'NOT_FOUND' | 'INVALID_REQUEST' | 'INTERNAL_ERROR';

export interface StorageAuditEvent {
  readonly id: string;
  readonly requestId: string;
  readonly actorId: string;
  readonly namespaceId: string;
  readonly action: StorageAuditAction;
  readonly key: string | null;
  readonly decision: StorageAuditDecision;
  readonly reason: StorageAuditReason;
  readonly occurredAt: string;
}

export interface StorageAuditSink {
  append(event: StorageAuditEvent): Promise<void>;
}
