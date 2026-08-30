import { strict as assert } from 'node:assert';
import { InMemoryStorageAuditSink } from '../../packages/mail-domain/in-memory-storage-audit';

const sink = new InMemoryStorageAuditSink();
const event = {
  id: 'evt-1', requestId: 'req-1', actorId: 'user-1', namespaceId: 'site-1',
  action: 'PUT' as const, key: 'public/index.html', decision: 'ALLOW' as const,
  reason: 'AUTHORIZED' as const, occurredAt: '2026-08-29T18:00:00.000Z',
};

await sink.append(event);
const events = sink.snapshot();
assert.equal(events.length, 1);
assert.deepEqual(events[0], event);
assert.throws(() => { (events[0] as { action: string }).action = 'DELETE'; });
assert.equal(sink.snapshot()[0].action, 'PUT');

console.log('storage audit contract tests passed');
