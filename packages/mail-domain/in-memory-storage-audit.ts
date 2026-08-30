import type { StorageAuditEvent, StorageAuditSink } from '../mail-types/storage-audit';

export class InMemoryStorageAuditSink implements StorageAuditSink {
  private readonly events: StorageAuditEvent[] = [];

  async append(event: StorageAuditEvent): Promise<void> {
    this.events.push(Object.freeze({ ...event }));
  }

  snapshot(): readonly StorageAuditEvent[] {
    return this.events.map((event) => Object.freeze({ ...event }));
  }
}
